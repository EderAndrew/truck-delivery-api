import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Truck } from './entities/truck.entity.js';
import { TrucksController } from './trucks.controller.js';
import { TrucksService } from './trucks.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Truck])],
  controllers: [TrucksController],
  providers: [TrucksService],
  exports: [TrucksService],
})
export class TrucksModule {}
