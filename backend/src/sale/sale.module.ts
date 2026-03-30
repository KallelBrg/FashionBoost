import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from '../entities/sale.entity';
import { SaleItem } from '../entities/sale-item.entity';
import { Product } from '../entities/product.entity';
import { Customer } from '../entities/customer.entity';
import { Coupon } from '../entities/coupon.entity';
import { SaleService } from './sale.service';
import { SaleController } from './sale.controller';
import { AuthModule } from '../auth/auth.module';
import { StoreModule } from '../store/store.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem, Product, Customer, Coupon]),
    AuthModule,
    StoreModule,
    LoyaltyModule,
  ],
  controllers: [SaleController],
  providers: [SaleService],
  exports: [SaleService],
})
export class SaleModule {}
