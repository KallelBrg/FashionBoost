import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Store } from './store.entity';
import { Sale } from './sale.entity';
import { CustomerLoyalty } from './customer-loyalty.entity';
import { Coupon } from './coupon.entity';
import { PointsTransaction } from './points-transaction.entity';

@Entity('customers')
@Unique(['storeId', 'cpf'])
@Unique(['storeId', 'email'])
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  cpf: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Store, (store) => store.customers)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @OneToMany(() => Sale, (sale) => sale.customer)
  sales: Sale[];

  @OneToOne(() => CustomerLoyalty, (loyalty) => loyalty.customer)
  loyalty: CustomerLoyalty;

  @OneToMany(() => Coupon, (coupon) => coupon.customer)
  coupons: Coupon[];

  @OneToMany(() => PointsTransaction, (tx) => tx.customer)
  pointsTransactions: PointsTransaction[];
}
