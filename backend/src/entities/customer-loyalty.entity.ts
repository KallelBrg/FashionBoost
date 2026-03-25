import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { LoyaltyLevel } from './loyalty-level.entity';
import { PointsTransaction } from './points-transaction.entity';

@Entity('customer_loyalties')
export class CustomerLoyalty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'uuid', nullable: true })
  loyaltyLevelId: string;

  @Column({ type: 'int', default: 0 })
  currentPoints: number;

  @Column({ type: 'int', default: 0 })
  totalPoints: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Customer, (customer) => customer.loyalty)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => LoyaltyLevel, (level) => level.customerLoyalties, { nullable: true })
  @JoinColumn({ name: 'loyaltyLevelId' })
  loyaltyLevel: LoyaltyLevel;

  @OneToMany(() => PointsTransaction, (tx) => tx.customerLoyalty)
  pointsTransactions: PointsTransaction[];
}
