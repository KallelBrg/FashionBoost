import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from '../entities/sale.entity';
import { SaleItem } from '../entities/sale-item.entity';
import { Product } from '../entities/product.entity';
import { Customer } from '../entities/customer.entity';
import { SaleService } from './sale.service';
import { SaleController } from './sale.controller';
import { AuthModule } from '../auth/auth.module';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem, Product, Customer]),
    AuthModule,
    StoreModule,
  ],
  controllers: [SaleController],
  providers: [SaleService],
  exports: [SaleService],
})
export class SaleModule {}
