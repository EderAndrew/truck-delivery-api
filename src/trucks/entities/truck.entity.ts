import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity.js';
import { TruckStatus } from '../../common/enums/truck-status.enum.js';

@Entity('trucks')
@Index(['tenant_id', 'plate'], { unique: true })
export class Truck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'varchar', nullable: false })
  plate: string;

  @Column({ type: 'varchar', nullable: true })
  truck_type: string;

  @Column({ type: 'varchar', nullable: false })
  gh_profile: string;

  @Column({ type: 'integer', nullable: true })
  max_weight_kg: number;

  @Column({ type: 'enum', enum: TruckStatus, nullable: true })
  status: TruckStatus;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
