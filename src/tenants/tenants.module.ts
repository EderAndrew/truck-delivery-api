import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity.js';
import { User } from '../users/entities/user.entity.js';
import { TenantsController } from './tenants.controller.js';
import { TenantsService } from './tenants.service.js';
import { EmailModule } from '../email/email.module.js';
import { GeocodingModule } from '../geocoding/geocoding.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, User]),
    EmailModule,
    GeocodingModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
