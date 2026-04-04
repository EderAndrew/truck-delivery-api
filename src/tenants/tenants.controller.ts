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
import { TenantsService } from './tenants.service.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';
import { RegisterTenantDto } from './dto/register-tenant.dto.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';

@Controller('tenants')
@Roles(Role.ADMIN) // todas as rotas deste controller exigem ADMIN por padrão
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Public() // qualquer pessoa pode registrar um novo tenant
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterTenantDto) {
    return this.tenantsService.register(dto);
  }

  @Get('tenants')
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get('myTenant/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch('update/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Delete('remove/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.remove(id);
  }
}
