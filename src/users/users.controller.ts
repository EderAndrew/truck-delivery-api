/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { FindAllUsersQueryDto } from './dto/find-all-users-query.dto.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { GetUser } from '../auth/decorators/get-user.decorator.js';

@Controller('users')
@Roles(Role.ADMIN) // gerenciamento de usuários é restrito ao ADMIN
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public() // link de verificação chega por e-mail, sem token JWT
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.usersService.verifyEmail(token);
  }

  @Post('create')
  create(@Body() dto: CreateUserDto, @GetUser('tenant_id') tenantId: string) {
    return this.usersService.create(dto, tenantId);
  }

  @Roles(Role.MASTER, Role.ADMIN, Role.USER, Role.DRIVER)
  @Get('me')
  getMe(@GetUser() user: any) {
    return this.usersService.me(user.sub as string, user.tenant_id as string);
  }

  @Get('all')
  findAll(
    @GetUser('tenant_id') tenantId: string,
    @Query() query: FindAllUsersQueryDto,
  ) {
    return this.usersService.findAll(tenantId, query);
  }

  @Get('user/:id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('tenant_id') tenantId: string,
  ) {
    return this.usersService.findOne(id, tenantId);
  }

  @Patch('user/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('tenant_id') tenantId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, tenantId, dto);
  }

  @Delete('user/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('tenant_id') tenantId: string,
  ) {
    return this.usersService.remove(id, tenantId);
  }
}
