import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Point } from 'geojson';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: false, unique: true })
  cnpj: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  address_street: string;

  @Column({ type: 'varchar', nullable: true })
  address_number: string;

  @Column({ type: 'varchar', nullable: true })
  address_city: string;

  @Column({ type: 'varchar', nullable: true })
  address_state: string;

  @Column({ type: 'varchar', nullable: true })
  address_zip: string;

  @Column({ type: 'varchar', nullable: true })
  address_country: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  origin_point: Point;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
