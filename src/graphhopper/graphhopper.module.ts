import { Module } from '@nestjs/common';
import { GraphHopperService } from './graphhopper.service.js';

@Module({
  providers: [GraphHopperService],
  exports: [GraphHopperService],
})
export class GraphHopperModule {}
