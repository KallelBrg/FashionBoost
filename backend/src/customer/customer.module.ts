import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../entities/customer.entity';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { AuthModule } from '../auth/auth.module';
import { StoreModule } from '../store/store.module';

@Module({
  imports: [TypeOrmModule.forFeature([Customer]), AuthModule, StoreModule],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
