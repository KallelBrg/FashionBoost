import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { jsonrepair } from 'jsonrepair';
import { Sale, SaleStatus } from '../entities/sale.entity';
import { SaleItem } from '../entities/sale-item.entity';
import { Product } from '../entities/product.entity';
import { Customer } from '../entities/customer.entity';
import { Coupon } from '../entities/coupon.entity';

export interface ProductPerformance {
  id: string;
  name: string;
  price: number;
  pointsValue: number;
  stockQuantity: number;
  soldQuantity: number;
  revenue: number;
}

export interface AiSuggestion {
  product: string;
  type: 'price' | 'points' | 'promotion' | 'stock';
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}

export interface DashboardInsights {
  metrics: {
    totalSales: number;
    totalRevenue: number;
    avgOrderValue: number;
    totalCustomers: number;
    totalCoupons: number;
    totalPointsDistributed: number;
  };
  topProducts: ProductPerformance[];
  slowProducts: ProductPerformance[];
  recentSales: { id: string; customerName: string; total: number; date: string; status: string }[];
  aiSuggestions: AiSuggestion[];
  aiSummary: string;
}

@Injectable()
export class DashboardService {
  private groq: Groq;
  private aiCache: { storeId: string; data: { aiSuggestions: AiSuggestion[]; aiSummary: string }; expiresAt: number } | null = null;
  clearCache() { this.aiCache = null; }

  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    private configService: ConfigService,
  ) {
    this.groq = new Groq({
      apiKey: this.configService.get<string>('GROQ_API_KEY') || '',
    });
  }

  async getInsights(storeId: string): Promise<DashboardInsights> {
    const [sales, products, customers, coupons, saleItems] = await Promise.all([
      this.saleRepository.find({
        where: { storeId },
        relations: ['customer', 'items'],
      }),
      this.productRepository.find({ where: { storeId, isActive: true } }),
      this.customerRepository.find({ where: { storeId } }),
      this.couponRepository.find({ where: { storeId } }),
      this.saleItemRepository
        .createQueryBuilder('si')
        .innerJoin('si.sale', 'sale', 'sale.storeId = :storeId AND sale.status = :status', {
          storeId,
          status: SaleStatus.ACTIVE,
        })
        .select(['si.productId', 'SUM(si.quantity) as soldQty', 'SUM(si.totalPrice) as revenue'])
        .groupBy('si.productId')
        .getRawMany(),
    ]);

    const activeSales = sales.filter((s) => s.status === SaleStatus.ACTIVE);
    const totalRevenue = activeSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const totalPointsDistributed = activeSales.reduce(
      (sum, s) => sum + (s.items ?? []).reduce((acc, i) => acc + (i.earnedPoints || 0), 0),
      0,
    );

    const salesMap = new Map<string, { soldQty: number; revenue: number }>();
    for (const row of saleItems) {
      salesMap.set(row.si_productId, {
        soldQty: Number(row.soldqty),
        revenue: Number(row.revenue),
      });
    }

    const performance: ProductPerformance[] = products.map((p) => {
      const data = salesMap.get(p.id) ?? { soldQty: 0, revenue: 0 };
      return {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        pointsValue: p.pointsValue,
        stockQuantity: p.stockQuantity,
        soldQuantity: data.soldQty,
        revenue: data.revenue,
      };
    });

    const topProducts = [...performance].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const slowProducts = [...performance]
      .filter((p) => p.stockQuantity > 3)
      .sort((a, b) => a.soldQuantity - b.soldQuantity)
      .slice(0, 5);

    const recentSales = sales
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        customerName: s.customer?.name ?? '—',
        total: Number(s.totalAmount),
        date: s.createdAt.toString(),
        status: s.status,
      }));

    const metrics = {
      totalSales: activeSales.length,
      totalRevenue,
      avgOrderValue: activeSales.length > 0 ? totalRevenue / activeSales.length : 0,
      totalCustomers: customers.length,
      totalCoupons: coupons.length,
      totalPointsDistributed,
    };

    const now = Date.now();
    let aiResult: { aiSuggestions: AiSuggestion[]; aiSummary: string };
    if (this.aiCache && this.aiCache.storeId === storeId && this.aiCache.expiresAt > now) {
      aiResult = this.aiCache.data;
    } else {
      aiResult = await this.generateAiInsights(metrics, topProducts, slowProducts, performance);
      this.aiCache = { storeId, data: aiResult, expiresAt: now + 60 * 60 * 1000 };
    }

    return { metrics, topProducts, slowProducts, recentSales, ...aiResult };
  }

  private async generateAiInsights(
    metrics: DashboardInsights['metrics'],
    topProducts: ProductPerformance[],
    slowProducts: ProductPerformance[],
    allProducts: ProductPerformance[],
  ): Promise<{ aiSuggestions: AiSuggestion[]; aiSummary: string }> {
    try {
      const prompt = `Você é um consultor especializado em CRM e varejo de moda. Analise os dados reais de uma loja e gere sugestões estratégicas que beneficiem AMBOS os lados: o lojista (receita, margem, giro de estoque) e o cliente (valor percebido, fidelidade, experiência de compra).

REGRAS OBRIGATÓRIAS:
- Nunca sugira algo que coloque a loja no prejuízo ou reduza demais a margem
- Toda sugestão de desconto deve ser justificada pelo ganho em volume ou giro de estoque
- O campo "impact" representa o impacto positivo para o NEGÓCIO da loja (receita, fidelização, estoque)
- Sugestões de pontos devem considerar que pontos têm custo indireto (viram cupons de desconto)
- Seja específico: cite valores, percentuais ou quantidades sempre que possível

MÉTRICAS DA LOJA:
- Vendas ativas: ${metrics.totalSales}
- Receita total: R$ ${metrics.totalRevenue.toFixed(2)}
- Ticket médio: R$ ${metrics.avgOrderValue.toFixed(2)}
- Clientes cadastrados: ${metrics.totalCustomers}
- Cupons gerados: ${metrics.totalCoupons}
- Pontos distribuídos: ${metrics.totalPointsDistributed}

TODOS OS PRODUTOS:
${allProducts.map((p) => `- ${p.name}: ${p.soldQuantity} vendas, R$ ${p.revenue.toFixed(2)} receita total, preco R$ ${p.price.toFixed(2)}, ${p.pointsValue} pts por compra, ${p.stockQuantity} em estoque`).join('\n')}

PRODUTOS MAIS VENDIDOS (por receita):
${topProducts.length > 0 ? topProducts.map((p) => `- ${p.name}: ${p.soldQuantity} vendas, R$ ${p.revenue.toFixed(2)}`).join('\n') : '- Nenhuma venda registrada ainda'}

PRODUTOS COM ESTOQUE PARADO:
${slowProducts.length > 0 ? slowProducts.map((p) => `- ${p.name}: ${p.soldQuantity} vendas, ${p.stockQuantity} em estoque`).join('\n') : '- Nenhum'}

Retorne APENAS JSON valido neste formato:
{
  "summary": "analise da situacao atual da loja destacando pontos fortes, riscos e oportunidades de crescimento sustentavel",
  "suggestions": [
    {
      "product": "nome do produto ou Geral",
      "type": "price ou points ou promotion ou stock",
      "suggestion": "sugestao especifica, acionavel, com justificativa de beneficio para a loja e para o cliente",
      "impact": "high ou medium ou low"
    }
  ]
}

Gere entre 4 e 6 sugestoes equilibradas e relevantes para os dados apresentados.`;

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Você é um consultor de CRM para varejo de moda. Responda SEMPRE com JSON puro e válido, sem markdown, sem blocos de código, sem texto fora do JSON. NUNCA use aspas duplas dentro de valores de strings — reescreva a frase sem aspas internas.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      });

      const raw = completion.choices[0]?.message?.content?.trim() ?? '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON não encontrado na resposta');

      const parsed = JSON.parse(jsonrepair(jsonMatch[0]));

      return {
        aiSuggestions: parsed.suggestions ?? [],
        aiSummary: parsed.summary ?? '',
      };
    } catch (err) {
      console.error('[Groq error]', err);
      return {
        aiSuggestions: [],
        aiSummary: 'Não foi possível gerar sugestões no momento. Tente novamente em instantes.',
      };
    }
  }
}
