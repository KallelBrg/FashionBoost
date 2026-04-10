"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import {
  ShoppingBag, Users, Star, Ticket, TrendingUp, TrendingDown,
  Sparkles, RefreshCw, DollarSign, Package,
} from "lucide-react";

interface ProductPerformance {
  id: string;
  name: string;
  price: number;
  pointsValue: number;
  stockQuantity: number;
  soldQuantity: number;
  revenue: number;
}

interface AiSuggestion {
  product: string;
  type: "price" | "points" | "promotion" | "stock";
  suggestion: string;
  impact: "high" | "medium" | "low";
}

interface Insights {
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

const IMPACT_STYLE: Record<string, string> = {
  high: "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-green-500/10 text-green-400 border-green-500/20",
};
const IMPACT_LABEL: Record<string, string> = { high: "Alto impacto", medium: "Médio impacto", low: "Baixo impacto" };

const TYPE_ICON: Record<string, React.ReactNode> = {
  price: <DollarSign size={14} />,
  points: <Star size={14} />,
  promotion: <TrendingUp size={14} />,
  stock: <Package size={14} />,
};
const TYPE_LABEL: Record<string, string> = {
  price: "Preço",
  points: "Pontos",
  promotion: "Promoção",
  stock: "Estoque",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  async function fetchInsights() {
    setLoading(true);
    try {
      const res = await api.get("/dashboard/insights");
      setInsights(res.data);
    } catch {
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }

  async function refreshAi() {
    if (!insights) return;
    setAiLoading(true);
    try {
      const res = await api.get("/dashboard/insights");
      setInsights(res.data);
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => { fetchInsights(); }, []);

  const m = insights?.metrics;

  const cards = [
    { label: "Vendas Ativas", value: m?.totalSales ?? "—", sub: m ? `R$ ${Number(m.totalRevenue).toFixed(2).replace(".", ",")} em receita` : "", icon: ShoppingBag },
    { label: "Ticket Médio", value: m ? `R$ ${Number(m.avgOrderValue).toFixed(2).replace(".", ",")}` : "—", sub: "por venda", icon: TrendingUp },
    { label: "Clientes", value: m?.totalCustomers ?? "—", sub: "cadastrados", icon: Users },
    { label: "Pontos Dist.", value: m ? Number(m.totalPointsDistributed).toLocaleString("pt-BR") : "—", sub: "pontos distribuídos", icon: Star },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-10">
        <p className="text-accent text-xs tracking-[0.3em] uppercase mb-1">Visão Geral</p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">
          Olá, {user?.name?.split(" ")[0]}.
        </h1>
        <p className="text-white/40 text-sm mt-1">Relatório inteligente da sua loja.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-white/30">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Analisando dados e gerando sugestões com IA...</p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map(({ label, value, sub, icon: Icon }) => (
              <div key={label} className="bg-[#0d0d0d] border border-white/5 p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/40 uppercase tracking-widest">{label}</p>
                  <Icon size={16} strokeWidth={1.5} className="text-accent" />
                </div>
                <div>
                  <p className="text-3xl font-bold font-[family-name:var(--font-playfair)]">{value}</p>
                  {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-[#0d0d0d] border border-white/5 p-6">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={14} className="text-green-400" />
                <h2 className="text-xs uppercase tracking-widest text-white/50">Mais Vendidos</h2>
              </div>
              {insights?.topProducts.length === 0 ? (
                <p className="text-white/20 text-sm text-center py-6">Nenhuma venda registrada ainda.</p>
              ) : (
                <div className="space-y-3">
                  {insights?.topProducts.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-4">
                      <span className="text-white/20 text-xs w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{p.name}</p>
                        <p className="text-xs text-white/30">{p.soldQuantity} vendas · {p.pointsValue} pts</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-green-400">R$ {Number(p.revenue).toFixed(2).replace(".", ",")}</p>
                        <p className="text-xs text-white/30">R$ {Number(p.price).toFixed(2).replace(".", ",")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Slow Products */}
            <div className="bg-[#0d0d0d] border border-white/5 p-6">
              <div className="flex items-center gap-2 mb-5">
                <TrendingDown size={14} className="text-yellow-400" />
                <h2 className="text-xs uppercase tracking-widest text-white/50">Estoque Parado</h2>
              </div>
              {insights?.slowProducts.length === 0 ? (
                <p className="text-white/20 text-sm text-center py-6">Nenhum produto com estoque parado.</p>
              ) : (
                <div className="space-y-3">
                  {insights?.slowProducts.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-4">
                      <span className="text-white/20 text-xs w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{p.name}</p>
                        <p className="text-xs text-white/30">{p.stockQuantity} em estoque · {p.soldQuantity} vendas</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-yellow-400">R$ {Number(p.price).toFixed(2).replace(".", ",")}</p>
                        <p className="text-xs text-white/30">{p.pointsValue} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-[#0d0d0d] border border-accent/20 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-accent" />
                <h2 className="text-xs uppercase tracking-widest text-white/50">Sugestões da IA</h2>
                <span className="text-xs text-accent/60 border border-accent/20 px-2 py-0.5">Llama 3.3</span>
              </div>
              <button
                onClick={refreshAi}
                disabled={aiLoading}
                className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white transition-colors disabled:opacity-40"
              >
                <RefreshCw size={12} className={aiLoading ? "animate-spin" : ""} />
                Atualizar
              </button>
            </div>

            {insights?.aiSummary && (
              <p className="text-sm text-white/50 mb-6 leading-relaxed border-l-2 border-accent/30 pl-4">
                {insights.aiSummary}
              </p>
            )}

            {insights?.aiSuggestions.length === 0 ? (
              <p className="text-white/20 text-sm text-center py-4">
                Adicione produtos e registre vendas para receber sugestões personalizadas.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {insights?.aiSuggestions.map((s, i) => (
                  <div key={i} className="border border-white/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-accent">
                        {TYPE_ICON[s.type]}
                        <span className="text-xs uppercase tracking-widest">{TYPE_LABEL[s.type]}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 border ${IMPACT_STYLE[s.impact]}`}>
                        {IMPACT_LABEL[s.impact]}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 font-medium">{s.product}</p>
                    <p className="text-sm text-white/80 leading-relaxed">{s.suggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Sales */}
          {insights?.recentSales && insights.recentSales.length > 0 && (
            <div className="bg-[#0d0d0d] border border-white/5 p-6">
              <div className="flex items-center gap-2 mb-5">
                <Ticket size={14} className="text-accent" />
                <h2 className="text-xs uppercase tracking-widest text-white/50">Vendas Recentes</h2>
              </div>
              <div className="space-y-2">
                {insights.recentSales.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm">{s.customerName}</p>
                      <p className="text-xs text-white/30">
                        {new Date(s.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 ${s.status === "active" ? "bg-green-500/10 text-green-400" : s.status === "cancelled" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                        {s.status === "active" ? "Ativa" : s.status === "cancelled" ? "Cancelada" : "Trocada"}
                      </span>
                      <p className="text-sm font-medium">R$ {Number(s.total).toFixed(2).replace(".", ",")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
