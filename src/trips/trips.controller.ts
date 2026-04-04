import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { TripsService } from './trips.service.js';
import { CreateTripDto } from './dto/create-trip.dto.js';
import { UpdateTripDto } from './dto/update-trip.dto.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';

@Controller('trips')
@Roles(Role.ADMIN, Role.USER, Role.DRIVER)
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Roles(Role.ADMIN, Role.USER)
  @Post('create')
  create(@Body() dto: CreateTripDto, @GetUser('tenant_id') tenantId: string) {
    return this.tripsService.create(dto, tenantId);
  }

  @Get('all')
  findAll(@GetUser('tenant_id') tenantId: string) {
    return this.tripsService.findAll(tenantId);
  }

  @Public()
  @Get('track/:token')
  findByToken(@Param('token') token: string) {
    return this.tripsService.findByTrackingToken(token);
  }

  @Get('trip/:id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('tenant_id') tenantId: string,
  ) {
    return this.tripsService.findOne(id, tenantId);
  }

  @Patch('trip/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('tenant_id') tenantId: string,
    @Body() dto: UpdateTripDto,
  ) {
    return this.tripsService.update(id, tenantId, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('trip/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('tenant_id') tenantId: string,
  ) {
    return this.tripsService.remove(id, tenantId);
  }
}
