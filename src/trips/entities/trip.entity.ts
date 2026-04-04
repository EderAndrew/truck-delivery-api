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
import { Job } from '../../jobs/entities/job.entity.js';
import { Truck } from '../../trucks/entities/truck.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { TripStatus } from '../../common/enums/trip-status.enum.js';
@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  tenant_id: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'uuid', nullable: false })
  job_id: string;

  @ManyToOne(() => Job, { onDelete: 'RESTRICT' })
  job: Job;

  @Column({ type: 'uuid', nullable: false })
  truck_id: string;

  @ManyToOne(() => Truck, { onDelete: 'RESTRICT' })
  truck: Truck;

  @Column({ type: 'uuid', nullable: false })
  driver_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  driver: User;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'LineString',
    srid: 4326,
    nullable: true,
  })
  @Index({ spatial: true })
  route: object;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  @Index({ spatial: true })
  current_location: object;

  @Column({ type: 'timestamp', nullable: true })
  last_location_update: Date;

  @Column({ type: 'timestamp', nullable: true })
  estimated_arrival: Date;

  @Column({ type: 'numeric', nullable: true })
  distance_m: number;

  @Column({ type: 'integer', nullable: true })
  duration_s: number;

  @Column({ type: 'timestamp', nullable: true })
  start_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time: Date;

  @Column({ type: 'varchar', unique: true, nullable: true })
  public_tracking_token: string;

  @Column({ type: 'enum', enum: TripStatus, nullable: true })
  status: TripStatus;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
