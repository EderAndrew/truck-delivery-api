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
  Query,
} from '@nestjs/common';
import { TrucksService } from './trucks.service.js';
import { CreateTruckDto } from './dto/create-truck.dto.js';
import { UpdateTruckDto } from './dto/update-truck.dto.js';
import { FindAllTrucksQueryDto } from './dto/find-all-trucks-query.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';

@Controller('trucks')
@Roles(Role.ADMIN)
export class TrucksController {
  constructor(private readonly trucksService: TrucksService) {}

  @Post('create')
  create(@Body() dto: CreateTruckDto, @GetUser('tenant_id') tenantId: string) {
    return this.trucksService.create(dto, tenantId);
  }

  @Roles(Role.ADMIN, Role.USER)
  @Get('all')
  findAll(
    @GetUser('tenant_id') tenantId: string,
    @Query() query: FindAllTrucksQueryDto,
  ) {
    return this.trucksService.findAll(tenantId, query);
  }

  @Roles(Role.ADMIN, Role.USER)
  @Get('truck/:id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('tenant_id') tenantId: string,
  ) {
    return this.trucksService.findOne(id, tenantId);
  }

  @Patch('truck/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTruckDto,
    @GetUser('tenant_id') tenantId: string,
  ) {
    return this.trucksService.update(id, dto, tenantId);
  }

  @Delete('truck/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('tenant_id') tenantId: string,
  ) {
    return this.trucksService.remove(id, tenantId);
  }
}
