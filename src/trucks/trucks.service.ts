import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Truck } from './entities/truck.entity.js';
import { FindAllTrucksQueryDto } from './dto/find-all-trucks-query.dto.js';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto.js';
import { CreateTruckDto } from './dto/create-truck.dto.js';
import { UpdateTruckDto } from './dto/update-truck.dto.js';

@Injectable()
export class TrucksService {
  constructor(
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
  ) {}

  async create(dto: CreateTruckDto, tenant_id: string): Promise<Truck> {
    const existing = await this.truckRepository.findOne({
      where: { tenant_id, plate: dto.plate },
    });
    if (existing)
      throw new ConflictException('Plate already registered for this tenant');

    const truck = this.truckRepository.create({ ...dto, tenant_id });
    return this.truckRepository.save(truck);
  }

  async findAll(
    tenant_id: string,
    query: FindAllTrucksQueryDto,
  ): Promise<PaginatedResponseDto<Truck>> {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Truck> = { tenant_id };

    if (status) where.status = status;

    const [data, total] = await this.truckRepository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string, tenant_id: string): Promise<Truck> {
    const truck = await this.truckRepository.findOne({
      where: { id, tenant_id },
    });
    if (!truck) throw new NotFoundException(`Truck ${id} not found`);
    return truck;
  }

  async update(
    id: string,
    dto: UpdateTruckDto,
    tenant_id: string,
  ): Promise<Truck> {
    const truck = await this.truckRepository.findOne({
      where: { id, tenant_id },
    });
    if (!truck) throw new NotFoundException(`Truck ${id} not found`);
    Object.assign(truck, dto);
    return this.truckRepository.save(truck);
  }

  async remove(id: string, tenant_id: string): Promise<void> {
    const truck = await this.truckRepository.findOne({
      where: { id, tenant_id },
    });
    if (!truck) throw new NotFoundException(`Truck ${id} not found`);
    await this.truckRepository.remove(truck);
  }
}
