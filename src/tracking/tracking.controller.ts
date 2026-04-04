/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Post, Body } from '@nestjs/common';
import { TrackingGateway } from './tracking.gateway';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';

@Controller('tracking')
@Roles(Role.DRIVER) // somente o DRIVER envia atualizações de localização
export class TrackingController {
  constructor(private gateway: TrackingGateway) {}

  @Post()
  updateLocation(@Body() body: any) {
    const { deliveryId, lat, lng } = body;

    this.gateway.sendLocation(deliveryId, { lat, lng });

    return { ok: true };
  }
}
