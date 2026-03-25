import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { CustomerLoyalty } from './customer-loyalty.entity';

export enum PointsTransactionType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  ADJUST = 'ADJUST',
}

export enum PointsTransactionSource {
  SALE = 'SALE',
  COUPON = 'COUPON',
  MANUAL = 'MANUAL',
}

@Entity('points_transactions')
export class PointsTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'uuid' })
  customerLoyaltyId: string;

  @Column({ type: 'varchar' })
  type: PointsTransactionType;

  @Column({ type: 'varchar' })
  source: PointsTransactionSource;

  @Column({ type: 'int' })
  points: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  referenceId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Customer, (customer) => customer.pointsTransactions)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => CustomerLoyalty, (cl) => cl.pointsTransactions)
  @JoinColumn({ name: 'customerLoyaltyId' })
  customerLoyalty: CustomerLoyalty;
}
