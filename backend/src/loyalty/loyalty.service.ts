import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyLevel } from '../entities/loyalty-level.entity';
import { CustomerLoyalty } from '../entities/customer-loyalty.entity';
import { PointsTransaction, PointsTransactionType, PointsTransactionSource } from '../entities/points-transaction.entity';
import { CreateLoyaltyLevelDto } from './dto/create-loyalty-level.dto';
import { UpdateLoyaltyLevelDto } from './dto/update-loyalty-level.dto';
import { AdjustPointsDto } from './dto/adjust-points.dto';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyLevel)
    private loyaltyLevelRepository: Repository<LoyaltyLevel>,
    @InjectRepository(CustomerLoyalty)
    private customerLoyaltyRepository: Repository<CustomerLoyalty>,
    @InjectRepository(PointsTransaction)
    private pointsTransactionRepository: Repository<PointsTransaction>,
  ) {}

  // ---- LoyaltyLevel ----

  async createLevel(storeId: string, dto: CreateLoyaltyLevelDto): Promise<LoyaltyLevel> {
    const exists = await this.loyaltyLevelRepository.findOne({
      where: { storeId, name: dto.name },
    });
    if (exists) throw new ConflictException('Já existe um nível com esse nome');

    const level = this.loyaltyLevelRepository.create({ ...dto, storeId });
    return this.loyaltyLevelRepository.save(level);
  }

  async findAllLevels(storeId: string): Promise<LoyaltyLevel[]> {
    return this.loyaltyLevelRepository.find({
      where: { storeId },
      order: { minimumPoints: 'ASC' },
    });
  }

  async updateLevel(id: string, storeId: string, dto: UpdateLoyaltyLevelDto): Promise<LoyaltyLevel> {
    const level = await this.loyaltyLevelRepository.findOne({ where: { id, storeId } });
    if (!level) throw new NotFoundException('Nível não encontrado');
    Object.assign(level, dto);
    return this.loyaltyLevelRepository.save(level);
  }

  async removeLevel(id: string, storeId: string): Promise<void> {
    const level = await this.loyaltyLevelRepository.findOne({ where: { id, storeId } });
    if (!level) throw new NotFoundException('Nível não encontrado');
    await this.loyaltyLevelRepository.remove(level);
  }

  // ---- CustomerLoyalty ----

  async findOrCreateLoyalty(storeId: string, customerId: string): Promise<CustomerLoyalty> {
    let loyalty = await this.customerLoyaltyRepository.findOne({
      where: { storeId, customerId },
      relations: ['loyaltyLevel'],
    });

    if (!loyalty) {
      loyalty = this.customerLoyaltyRepository.create({
        storeId,
        customerId,
        currentPoints: 0,
        totalPoints: 0,
      });
      loyalty = await this.customerLoyaltyRepository.save(loyalty);
    }

    return loyalty;
  }

  async getCustomerLoyalty(customerId: string, storeId: string): Promise<CustomerLoyalty> {
    const loyalty = await this.customerLoyaltyRepository.findOne({
      where: { customerId, storeId },
      relations: ['loyaltyLevel', 'customer'],
    });
    if (!loyalty) throw new NotFoundException('Conta de fidelidade não encontrada');
    return loyalty;
  }

  async awardPoints(
    storeId: string,
    customerId: string,
    points: number,
    description: string,
    referenceId?: string,
  ): Promise<CustomerLoyalty> {
    const loyalty = await this.findOrCreateLoyalty(storeId, customerId);

    loyalty.currentPoints += points;
    loyalty.totalPoints += points;

    await this.updateLoyaltyLevel(loyalty, storeId);
    const saved = await this.customerLoyaltyRepository.save(loyalty);

    const transaction = new PointsTransaction();
    transaction.storeId = storeId;
    transaction.customerId = customerId;
    transaction.customerLoyaltyId = saved.id;
    transaction.type = PointsTransactionType.EARN;
    transaction.source = referenceId ? PointsTransactionSource.SALE : PointsTransactionSource.MANUAL;
    transaction.points = points;
    transaction.description = description;
    if (referenceId) transaction.referenceId = referenceId;
    await this.pointsTransactionRepository.save(transaction);

    return saved;
  }

  async revokePoints(
    storeId: string,
    customerId: string,
    points: number,
    description: string,
    referenceId?: string,
  ): Promise<void> {
    const loyalty = await this.findOrCreateLoyalty(storeId, customerId);

    loyalty.currentPoints = Math.max(0, Number(loyalty.currentPoints) - Number(points));
    await this.updateLoyaltyLevel(loyalty, storeId);
    const saved = await this.customerLoyaltyRepository.save(loyalty);

    const transaction = new PointsTransaction();
    transaction.storeId = storeId;
    transaction.customerId = customerId;
    transaction.customerLoyaltyId = saved.id;
    transaction.type = PointsTransactionType.ADJUST;
    transaction.source = PointsTransactionSource.SALE;
    transaction.points = -points;
    transaction.description = description;
    if (referenceId) transaction.referenceId = referenceId;
    await this.pointsTransactionRepository.save(transaction);
  }

  async adjustPoints(customerId: string, storeId: string, dto: AdjustPointsDto): Promise<CustomerLoyalty> {
    const loyalty = await this.findOrCreateLoyalty(storeId, customerId);

    loyalty.currentPoints += dto.points;
    if (dto.points > 0) loyalty.totalPoints += dto.points;

    await this.updateLoyaltyLevel(loyalty, storeId);
    const saved = await this.customerLoyaltyRepository.save(loyalty);

    const transaction = new PointsTransaction();
    transaction.storeId = storeId;
    transaction.customerId = customerId;
    transaction.customerLoyaltyId = saved.id;
    transaction.type = PointsTransactionType.ADJUST;
    transaction.source = PointsTransactionSource.MANUAL;
    transaction.points = dto.points;
    transaction.description = dto.description;
    await this.pointsTransactionRepository.save(transaction);

    return saved;
  }

  private async updateLoyaltyLevel(loyalty: CustomerLoyalty, storeId: string): Promise<void> {
    const levels = await this.loyaltyLevelRepository.find({
      where: { storeId },
      order: { minimumPoints: 'DESC' },
    });

    const newLevel = levels.find((l) => loyalty.totalPoints >= l.minimumPoints);
    if (newLevel) loyalty.loyaltyLevelId = newLevel.id;
  }
}
