import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity.js';
import { Job } from '../jobs/entities/job.entity.js';
import { Truck } from '../trucks/entities/truck.entity.js';
import { TripsController } from './trips.controller.js';
import { TripsService } from './trips.service.js';
import { TrackingModule } from '../tracking/tracking.module.js';
import { GraphHopperModule } from '../graphhopper/graphhopper.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, Job, Truck]),
    TrackingModule,
    GraphHopperModule,
  ],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
