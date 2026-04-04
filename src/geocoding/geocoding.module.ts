import { Module } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';

@Module({
  imports: [],
  controllers: [],
  providers: [GeocodingService],
  exports: [GeocodingService],
})
export class GeocodingModule {}
