import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from '../entities/coupon.entity';
import { CustomerLoyalty } from '../entities/customer-loyalty.entity';
import { PointsTransaction } from '../entities/points-transaction.entity';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { AuthModule } from '../auth/auth.module';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coupon, CustomerLoyalty, PointsTransaction]),
    AuthModule,
    StoreModule,
  ],
  controllers: [CouponController],
  providers: [CouponService],
  exports: [CouponService],
})
export class CouponModule {}
