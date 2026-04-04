import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Trip } from './entities/trip.entity.js';
import { CreateTripDto } from './dto/create-trip.dto.js';
import { UpdateTripDto } from './dto/update-trip.dto.js';
import { GeoJsonPoint } from '../common/types/geo.types.js';
import { GeoPointDto } from '../common/dto/geo-point.dto.js';
import { TrackingGateway } from '../tracking/tracking.gateway.js';
import { TripStatus } from '../common/enums/trip-status.enum.js';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  /**
   * Converte um DTO de ponto geográfico para o formato GeoJSON Point.
   * O PostGIS/TypeORM espera coordenadas no formato [longitude, latitude].
   */
  private toGeoJsonPoint(dto: GeoPointDto): GeoJsonPoint {
    return { type: 'Point', coordinates: [dto.longitude, dto.latitude] };
  }

  /**
   * Cria uma nova viagem para o tenant informado.
   * Converte campos de localização e datas para os tipos corretos,
   * e gera um token público único (UUID) para rastreamento sem autenticação.
   */
  create(dto: CreateTripDto, tenant_id: string): Promise<Trip> {
    const trip = this.tripRepository.create({
      ...dto,
      tenant_id,
      current_location: dto.current_location
        ? this.toGeoJsonPoint(dto.current_location)
        : undefined,
      estimated_arrival: dto.estimated_arrival
        ? new Date(dto.estimated_arrival)
        : undefined,
      start_time: dto.start_time ? new Date(dto.start_time) : undefined,
      public_tracking_token: uuidv4(),
    });
    return this.tripRepository.save(trip);
  }

  /**
   * Retorna todas as viagens do tenant, ordenadas da mais recente para a mais antiga.
   * Carrega os relacionamentos de job, truck e driver junto com cada viagem.
   */
  findAll(tenant_id?: string): Promise<Trip[]> {
    return this.tripRepository.find({
      where: { tenant_id },
      order: { created_at: 'DESC' },
      relations: ['job', 'truck', 'driver'],
    });
  }

  /**
   * Busca uma viagem específica pelo ID, garantindo que ela pertence ao tenant.
   * Lança NotFoundException se a viagem não for encontrada.
   * Retorna os relacionamentos de job, truck e driver.
   */
  async findOne(id: string, tenant_id: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id, tenant_id },
      relations: ['job', 'truck', 'driver'],
    });
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);
    return trip;
  }

  /**
   * Busca uma viagem pelo token público de rastreamento (sem autenticação).
   * Retorna apenas os campos necessários para rastreamento público:
   * localização atual, última atualização, previsão de chegada e status.
   * Lança NotFoundException se o token não existir.
   */
  async findByTrackingToken(token: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { public_tracking_token: token },
      select: [
        'id',
        'current_location',
        'last_location_update',
        'estimated_arrival',
        'status',
      ],
    });
    if (!trip) throw new NotFoundException('Tracking token not found');
    return trip;
  }

  /**
   * Atualiza os dados de uma viagem existente do tenant.
   * Se a localização atual for fornecida, converte para GeoJSON e atualiza
   * o campo last_location_update com o timestamp atual.
   * Campos de data são convertidos para objetos Date.
   * Lança NotFoundException se a viagem não for encontrada.
   */
  async update(
    id: string,
    tenant_id: string,
    dto: UpdateTripDto,
  ): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id, tenant_id },
    });
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);

    const now = new Date();

    Object.assign(trip, {
      ...dto,
      current_location: dto.current_location
        ? this.toGeoJsonPoint(dto.current_location)
        : trip.current_location,
      estimated_arrival: dto.estimated_arrival
        ? new Date(dto.estimated_arrival)
        : trip.estimated_arrival,
      start_time: dto.start_time
        ? new Date(dto.start_time)
        : dto.status === TripStatus.STARTED && !trip.start_time
          ? now
          : trip.start_time,
      end_time:
        dto.status === TripStatus.COMPLETED && !trip.end_time
          ? now
          : trip.end_time,
      last_location_update: dto.current_location
        ? now
        : trip.last_location_update,
    });

    const updatedTrip = await this.tripRepository.save(trip);

    if (dto.current_location) {
      this.trackingGateway.sendLocation(updatedTrip.public_tracking_token, {
        lat: dto.current_location.latitude,
        lng: dto.current_location.longitude,
        updatedAt: updatedTrip.last_location_update,
      });
    }

    return updatedTrip;
  }

  /**
   * Remove uma viagem do banco de dados, verificando que ela pertence ao tenant.
   * Lança NotFoundException se a viagem não existir.
   */
  async remove(id: string, tenant_id: string): Promise<void> {
    const trip = await this.tripRepository.findOne({
      where: { id, tenant_id },
    });
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);
    await this.tripRepository.remove(trip);
  }
}
