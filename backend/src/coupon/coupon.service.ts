import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from '../entities/coupon.entity';
import { CustomerLoyalty } from '../entities/customer-loyalty.entity';
import { PointsTransaction, PointsTransactionType, PointsTransactionSource } from '../entities/points-transaction.entity';
import { RedeemCouponDto } from './dto/redeem-coupon.dto';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    @InjectRepository(CustomerLoyalty)
    private customerLoyaltyRepository: Repository<CustomerLoyalty>,
    @InjectRepository(PointsTransaction)
    private pointsTransactionRepository: Repository<PointsTransaction>,
  ) {}

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async redeem(storeId: string, dto: RedeemCouponDto): Promise<Coupon> {
    const loyalty = await this.customerLoyaltyRepository.findOne({
      where: { storeId, customerId: dto.customerId },
    });
    if (!loyalty) throw new NotFoundException('Conta de fidelidade não encontrada');
    if (loyalty.currentPoints < dto.pointsUsed) {
      throw new BadRequestException(
        `Pontos insuficientes. Disponível: ${loyalty.currentPoints}, necessário: ${dto.pointsUsed}`,
      );
    }

    let code: string;
    let exists = true;
    while (exists) {
      code = this.generateCode();
      const found = await this.couponRepository.findOne({ where: { code } });
      exists = !!found;
    }

    loyalty.currentPoints -= dto.pointsUsed;
    await this.customerLoyaltyRepository.save(loyalty);

    const transaction = new PointsTransaction();
    transaction.storeId = storeId;
    transaction.customerId = dto.customerId;
    transaction.customerLoyaltyId = loyalty.id;
    transaction.type = PointsTransactionType.REDEEM;
    transaction.source = PointsTransactionSource.COUPON;
    transaction.points = -dto.pointsUsed;
    transaction.description = `Resgate de pontos - cupom ${code!}`;
    await this.pointsTransactionRepository.save(transaction);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const coupon = this.couponRepository.create({
      storeId,
      customerId: dto.customerId,
      code: code!,
      type: dto.type,
      rewardDescription: dto.rewardDescription,
      pointsUsed: dto.pointsUsed,
      discountValue: dto.discountValue ?? 0,
      expiresAt,
      isUsed: false,
    });

    return this.couponRepository.save(coupon);
  }

  async findAll(storeId: string): Promise<Coupon[]> {
    return this.couponRepository.find({
      where: { storeId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByCode(code: string, storeId: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { code, storeId } });
    if (!coupon) throw new NotFoundException('Cupom não encontrado');
    return coupon;
  }

  async useCoupon(code: string, storeId: string): Promise<Coupon> {
    const coupon = await this.findByCode(code, storeId);
    if (coupon.isUsed) throw new BadRequestException('Cupom já utilizado');
    if (new Date() > coupon.expiresAt) throw new BadRequestException('Cupom expirado');

    coupon.isUsed = true;
    coupon.usedAt = new Date();
    return this.couponRepository.save(coupon);
  }

  async findCustomerTransactions(customerId: string, storeId: string): Promise<PointsTransaction[]> {
    return this.pointsTransactionRepository.find({
      where: { customerId, storeId },
      order: { createdAt: 'DESC' },
    });
  }
}
