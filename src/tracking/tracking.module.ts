import { Module } from '@nestjs/common';
import { TrackingGateway } from './tracking.gateway';
import { TrackingController } from './tracking.controller';

@Module({
  providers: [TrackingGateway],
  controllers: [TrackingController],
  exports: [TrackingGateway],
})
export class TrackingModule {}
