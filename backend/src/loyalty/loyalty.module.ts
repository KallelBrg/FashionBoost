import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyLevel } from '../entities/loyalty-level.entity';
import { CustomerLoyalty } from '../entities/customer-loyalty.entity';
import { PointsTransaction } from '../entities/points-transaction.entity';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { AuthModule } from '../auth/auth.module';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoyaltyLevel, CustomerLoyalty, PointsTransaction]),
    AuthModule,
    StoreModule,
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
