import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import type { LineString } from 'geojson';
import { Trip } from './entities/trip.entity.js';
import { CreateTripDto } from './dto/create-trip.dto.js';
import { UpdateTripDto } from './dto/update-trip.dto.js';
import { GeoJsonPoint } from '../common/types/geo.types.js';
import { GeoPointDto } from '../common/dto/geo-point.dto.js';
import { TrackingGateway } from '../tracking/tracking.gateway.js';
import { TripStatus } from '../common/enums/trip-status.enum.js';
import { Job } from '../jobs/entities/job.entity.js';
import { Truck } from '../trucks/entities/truck.entity.js';
import { GraphHopperService } from '../graphhopper/graphhopper.service.js';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    private readonly trackingGateway: TrackingGateway,
    private readonly graphHopperService: GraphHopperService,
  ) {}

  private toGeoJsonPoint(dto: GeoPointDto): GeoJsonPoint {
    return { type: 'Point', coordinates: [dto.longitude, dto.latitude] };
  }

  async create(dto: CreateTripDto, tenant_id: string): Promise<Trip> {
    const [job, truck] = await Promise.all([
      this.jobRepository.findOne({ where: { id: dto.job_id } }),
      this.truckRepository.findOne({ where: { id: dto.truck_id } }),
    ]);

    if (!job) throw new NotFoundException(`Job ${dto.job_id} not found`);
    if (!truck) throw new NotFoundException(`Truck ${dto.truck_id} not found`);

    let route: LineString | undefined;
    let distance_m: number | undefined;
    let duration_s: number | undefined;
    let estimated_arrival: Date | undefined;

    if (job.origin_point && job.delivery_point) {
      try {
        const gh = await this.graphHopperService.getRoute(
          job.origin_point,
          job.delivery_point,
          truck.gh_profile,
        );
        route = gh.route;
        distance_m = gh.distance_m;
        duration_s = gh.duration_s;
        estimated_arrival = new Date(Date.now() + gh.duration_s * 1000);
      } catch {
        // trip is created without route if GraphHopper is unavailable
      }
    }

    const trip = this.tripRepository.create({
      tenant_id,
      job_id: dto.job_id,
      truck_id: dto.truck_id,
      driver_id: dto.driver_id,
      status: dto.status,
      current_location: dto.current_location
        ? this.toGeoJsonPoint(dto.current_location)
        : undefined,
      start_time: dto.start_time ? new Date(dto.start_time) : undefined,
      estimated_arrival:
        estimated_arrival ??
        (dto.estimated_arrival ? new Date(dto.estimated_arrival) : undefined),
      route,
      distance_m,
      duration_s,
      public_tracking_token: uuidv4(),
    });

    return this.tripRepository.save(trip);
  }

  findAll(tenant_id?: string): Promise<Trip[]> {
    return this.tripRepository.find({
      where: { tenant_id },
      order: { created_at: 'DESC' },
      relations: ['job', 'truck', 'driver'],
    });
  }

  async findOne(id: string, tenant_id: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id, tenant_id },
      relations: ['job', 'truck', 'driver'],
    });
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);
    return trip;
  }

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

  async remove(id: string, tenant_id: string): Promise<void> {
    const trip = await this.tripRepository.findOne({
      where: { id, tenant_id },
    });
    if (!trip) throw new NotFoundException(`Trip ${id} not found`);
    await this.tripRepository.remove(trip);
  }
}
