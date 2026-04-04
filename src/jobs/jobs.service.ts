import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { GeoJsonPoint } from '../common/types/geo.types.js';
import { GeoPointDto } from '../common/dto/geo-point.dto.js';
import { GeocodingService } from '../geocoding/geocoding.service.js';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly geocodingservice: GeocodingService,
  ) {}

  private toGeoJsonPoint(dto: GeoPointDto): GeoJsonPoint {
    return { type: 'Point', coordinates: [dto.longitude, dto.latitude] };
  }

  async create(dto: CreateJobDto, tenant_id: string): Promise<Job> {
    let geocodedPoint: GeoPointDto | undefined;

    if (dto.address_street && dto.address_city) {
      const stringAddress = `${dto.address_street}, ${dto.address_number}, ${dto.address_city}, ${dto.address_state}, ${dto.address_zip}, ${dto.address_country}`;
      try {
        geocodedPoint =
          await this.geocodingservice.getCoordinates(stringAddress);
      } catch {
        // ignored: job is created without delivery_point if geocoding fails
      }
    }

    const job = this.jobRepository.create({
      ...dto,
      tenant_id,
      origin_point: dto.origin_point
        ? this.toGeoJsonPoint(dto.origin_point)
        : undefined,
      delivery_point: geocodedPoint
        ? this.toGeoJsonPoint(geocodedPoint)
        : dto.delivery_point
          ? this.toGeoJsonPoint(dto.delivery_point)
          : undefined,
      scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : undefined,
    });
    return this.jobRepository.save(job);
  }

  findAll(tenant_id?: string): Promise<Job[]> {
    return this.jobRepository.find({
      where: { tenant_id },
      order: { scheduled_at: 'ASC' },
    });
  }

  async findOne(id: string, tenant_id: string): Promise<Job> {
    const job = await this.jobRepository.findOne({ where: { id, tenant_id } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  async update(id: string, tenant_id: string, dto: UpdateJobDto): Promise<Job> {
    const job = await this.jobRepository.findOne({ where: { id, tenant_id } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    Object.assign(job, {
      ...dto,
      tenant_id,
      origin_point: dto.origin_point
        ? this.toGeoJsonPoint(dto.origin_point)
        : job.origin_point,
      delivery_point: dto.delivery_point
        ? this.toGeoJsonPoint(dto.delivery_point)
        : job.delivery_point,
      scheduled_at: dto.scheduled_at
        ? new Date(dto.scheduled_at)
        : job.scheduled_at,
    });
    return this.jobRepository.save(job);
  }

  async remove(id: string, tenant_id: string): Promise<void> {
    const job = await this.jobRepository.findOne({ where: { id, tenant_id } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    await this.jobRepository.remove(job);
  }
}
