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
import { JobStatus } from '../../common/enums/job-status.enum.js';
import type { Point } from 'geojson';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'varchar', nullable: true })
  customer_name: string;

  @Column({ type: 'varchar', nullable: true })
  customer_phone: string;

  @Column({ type: 'varchar', nullable: true })
  address_street: string;

  @Column({ type: 'varchar', nullable: true })
  address_complement: string;

  @Column({ type: 'varchar', nullable: true })
  address_number: string;

  @Column({ type: 'varchar', nullable: true })
  address_city: string;

  @Column({ type: 'varchar', nullable: true })
  address_state: string;

  @Column({ type: 'varchar', nullable: true })
  address_zip: string;

  @Column({ type: 'varchar', nullable: true })
  country: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  origin_point: Point;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  @Index({ spatial: true })
  delivery_point: Point;

  @Column({ type: 'numeric', nullable: true })
  volume_m3: number;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  scheduled_at: Date;

  @Column({ type: 'enum', enum: JobStatus, nullable: true })
  status: JobStatus;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
