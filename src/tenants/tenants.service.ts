import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { FindAllTenantsQueryDto } from './dto/find-all-tenants-query.dto.js';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto.js';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Tenant } from './entities/tenant.entity.js';
import { User } from '../users/entities/user.entity.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';
import { RegisterTenantDto } from './dto/register-tenant.dto.js';
import { EmailService } from '../email/email.service.js';
import { Role } from '../common/enums/role.enum.js';
import { GeocodingService } from '../geocoding/geocoding.service.js';

export interface RegisterResult {
  tenant: Tenant;
  user: Omit<User, 'password_hash' | 'email_verification_token'>;
}

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly geocodingService: GeocodingService,
  ) {}

  async register(dto: RegisterTenantDto): Promise<RegisterResult> {
    const existingTenant = await this.tenantRepository.findOne({
      where: { cnpj: dto.cnpj },
    });
    if (existingTenant) {
      throw new ConflictException('CNPJ já cadastrado');
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: dto.admin_email },
    });
    if (existingUser) {
      throw new ConflictException('Email de administrador já está em uso');
    }

    let origin_point:
      | { type: 'Point'; coordinates: [number, number] }
      | undefined;

    try {
      const stringAddress = `${dto.address_street}, ${dto.address_number}, ${dto.address_city}, ${dto.address_state}, ${dto.address_zip}, ${dto.address_country}`;
      const coords = await this.geocodingService.getCoordinates(stringAddress);
      origin_point = {
        type: 'Point',
        coordinates: [coords.longitude, coords.latitude],
      };
    } catch {
      // ignored: tenant is created without origin_point if geocoding fails
    }

    const tenant = await this.tenantRepository.save(
      this.tenantRepository.create({
        name: dto.name,
        cnpj: dto.cnpj,
        phone: dto.phone,
        email: dto.company_email,
        address_street: dto.address_street,
        address_number: dto.address_number,
        address_city: dto.address_city,
        address_state: dto.address_state,
        address_zip: dto.address_zip,
        address_country: dto.address_country,
        is_active: true,
        origin_point,
      }),
    );

    const verificationToken = uuidv4();
    const password_hash = await bcrypt.hash(dto.admin_password, 12);

    const savedUser = await this.userRepository.save(
      this.userRepository.create({
        tenant_id: tenant.id,
        name: dto.admin_name,
        email: dto.admin_email,
        password_hash,
        role: Role.ADMIN,
        email_verified: false,
        email_verification_token: verificationToken,
        is_active: false,
      }),
    );

    await this.emailService.sendEmailVerification(
      dto.admin_email,
      dto.admin_name,
      verificationToken,
    );

    const user: Omit<User, 'password_hash' | 'email_verification_token'> = {
      id: savedUser.id,
      tenant_id: savedUser.tenant_id,
      tenant: savedUser.tenant,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      email_verified: savedUser.email_verified,
      is_active: savedUser.is_active,
      photo: savedUser.photo,
      created_at: savedUser.created_at,
      updated_at: savedUser.updated_at,
    };

    return { tenant, user };
  }

  async findAll(
    query: FindAllTenantsQueryDto,
  ): Promise<PaginatedResponseDto<Tenant>> {
    const { page, limit, is_active } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Tenant> = {};

    if (is_active !== undefined) where.is_active = is_active;

    const [data, total] = await this.tenantRepository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    Object.assign(tenant, dto);
    return this.tenantRepository.save(tenant);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    await this.tenantRepository.remove(tenant);
  }
}
