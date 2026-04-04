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
import { JobsService } from './jobs.service.js';
import { CreateJobDto } from './dto/create-job.dto.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';

@Controller('jobs')
@Roles(Role.ADMIN, Role.USER)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('create')
  create(@Body() dto: CreateJobDto, @GetUser('tenant_id') tenantId: string) {
    return this.jobsService.create(dto, tenantId);
  }

  @Get('all')
  findAll(@GetUser('tenant_id') tenantId: string) {
    return this.jobsService.findAll(tenantId);
  }

  @Get('job/:id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('tenant_id') tenantId: string,
  ) {
    return this.jobsService.findOne(id, tenantId);
  }

  @Patch('job/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('tenant_id') tenantId: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.update(id, tenantId, dto);
  }

  @Delete('job/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('tenant_id') tenantId: string,
  ) {
    return this.jobsService.remove(id, tenantId);
  }
}
