import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale, SaleStatus } from '../entities/sale.entity';
import { SaleItem } from '../entities/sale-item.entity';
import { Product } from '../entities/product.entity';
import { Customer } from '../entities/customer.entity';
import { Coupon, CouponType } from '../entities/coupon.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleStatusDto } from './dto/update-sale-status.dto';
import { LoyaltyService } from '../loyalty/loyalty.service';

@Injectable()
export class SaleService {
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
    private dataSource: DataSource,
    private loyaltyService: LoyaltyService,
  ) {}

  async create(storeId: string, userId: string, dto: CreateSaleDto): Promise<Sale> {
    const customer = await this.customerRepository.findOne({
      where: { id: dto.customerId, storeId },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    // Validate coupon before entering transaction
    let coupon: Coupon | null = null;
    if (dto.couponCode) {
      coupon = await this.couponRepository.findOne({
        where: { code: dto.couponCode.toUpperCase(), storeId },
      });
      if (!coupon) throw new NotFoundException('Cupom não encontrado');
      if (coupon.customerId !== dto.customerId) {
        throw new BadRequestException('Este cupom não pertence ao cliente selecionado');
      }
      if (coupon.isUsed) throw new BadRequestException('Cupom já foi utilizado');
      if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
        throw new BadRequestException('Cupom expirado');
      }
    }

    return this.dataSource.transaction(async (manager) => {
      let subtotal = 0;
      const saleItemsData: Partial<SaleItem>[] = [];

      for (const item of dto.items) {
        const product = await manager.findOne(Product, {
          where: { id: item.productId, storeId, isActive: true },
        });
        if (!product) throw new NotFoundException(`Produto ${item.productId} não encontrado`);
        if (product.stockQuantity < item.quantity) {
          throw new BadRequestException(`Estoque insuficiente para o produto "${product.name}"`);
        }

        const totalPrice = Number(product.price) * item.quantity;
        const earnedPoints = product.pointsValue * item.quantity;
        subtotal += totalPrice;

        product.stockQuantity -= item.quantity;
        await manager.save(Product, product);

        saleItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: Number(product.price),
          totalPrice,
          earnedPoints,
        });
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon) {
        if (coupon.type === CouponType.FIXED_DISCOUNT) {
          discountAmount = Math.min(Number(coupon.discountValue), subtotal);
        } else if (coupon.type === CouponType.PERCENTAGE_DISCOUNT) {
          discountAmount = subtotal * (Number(coupon.discountValue) / 100);
        }
        // GIFT type: no monetary discount, just a reward description

        // Mark coupon as used inside transaction
        await manager.update(Coupon, coupon.id, {
          isUsed: true,
          usedAt: new Date(),
        });
      }

      const totalAmount = Math.max(0, subtotal - discountAmount);

      const sale = manager.create(Sale, {
        storeId,
        customerId: dto.customerId,
        userId,
        subtotalAmount: subtotal,
        discountAmount,
        totalAmount,
        status: SaleStatus.ACTIVE,
      });

      const savedSale = await manager.save(Sale, sale);

      for (const itemData of saleItemsData) {
        const saleItem = manager.create(SaleItem, {
          ...itemData,
          saleId: savedSale.id,
        });
        await manager.save(SaleItem, saleItem);
      }

      const totalEarnedPoints = saleItemsData.reduce((sum, item) => sum + (item.earnedPoints || 0), 0);
      if (totalEarnedPoints > 0) {
        await this.loyaltyService.awardPoints(
          storeId,
          dto.customerId,
          totalEarnedPoints,
          `Pontos pela venda #${savedSale.id}`,
          savedSale.id,
        );
      }

      const result = await manager.findOne(Sale, {
        where: { id: savedSale.id },
        relations: ['items', 'items.product', 'customer'],
      });
      return result!;
    });
  }

  async findAll(storeId: string): Promise<Sale[]> {
    return this.saleRepository.find({
      where: { storeId },
      relations: ['customer', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, storeId: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id, storeId },
      relations: ['customer', 'items', 'items.product'],
    });
    if (!sale) throw new NotFoundException('Venda não encontrada');
    return sale;
  }

  async updateStatus(id: string, storeId: string, dto: UpdateSaleStatusDto): Promise<Sale> {
    const sale = await this.saleRepository.findOne({ where: { id, storeId } });
    if (!sale) throw new NotFoundException('Venda não encontrada');
    if (sale.status !== SaleStatus.ACTIVE) {
      throw new BadRequestException('Apenas vendas ativas podem ter o status alterado');
    }

    sale.status = dto.status;
    const updated = await this.saleRepository.save(sale);

    if (dto.status === SaleStatus.CANCELLED) {
      const items = await this.saleItemRepository.find({ where: { saleId: id } });

      // Restore stock for each item
      for (const item of items) {
        const product = await this.productRepository.findOne({ where: { id: item.productId } });
        if (product) {
          product.stockQuantity += item.quantity;
          await this.productRepository.save(product);
        }
      }

      // Revoke earned points
      const totalPoints = items.reduce((sum, item) => sum + (Number(item.earnedPoints) || 0), 0);
      if (totalPoints > 0) {
        await this.loyaltyService.revokePoints(
          storeId,
          sale.customerId,
          totalPoints,
          `Estorno de pontos - cancelamento da venda #${sale.id}`,
          sale.id,
        );
      }
    }

    return updated;
  }
}
