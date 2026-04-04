import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/job.entity.js';
import { JobsController } from './jobs.controller.js';
import { JobsService } from './jobs.service.js';
import { GeocodingModule } from '../geocoding/geocoding.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Job]), GeocodingModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
