import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Store } from './store.entity';
import { CustomerLoyalty } from './customer-loyalty.entity';

@Entity('loyalty_levels')
@Unique(['storeId', 'name'])
export class LoyaltyLevel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  storeId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'int' })
  minimumPoints: number;

  @Column({ type: 'text', nullable: true })
  benefitsDescription: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Store, (store) => store.loyaltyLevels)
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @OneToMany(() => CustomerLoyalty, (cl) => cl.loyaltyLevel)
  customerLoyalties: CustomerLoyalty[];
}
