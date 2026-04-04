import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity.js';
import { TripsController } from './trips.controller.js';
import { TripsService } from './trips.service.js';
import { TrackingModule } from '../tracking/tracking.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Trip]), TrackingModule],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
