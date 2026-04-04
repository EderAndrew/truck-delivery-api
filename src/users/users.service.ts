/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserType } from 'src/common/types/user.types.js';
import { EmailService } from '../email/email.service.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  async create(
    dto: CreateUserDto,
    tenant_id: string,
  ): Promise<User | undefined> {
    try {
      const existing = await this.userRepository.findOne({
        where: { tenant_id, email: dto.email },
      });
      if (existing)
        throw new ConflictException('Email already in use for this tenant');

      const rawPassword = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();

      const password_hash = await bcrypt.hash(rawPassword, 12);

      const user = this.userRepository.create({
        ...dto,
        password_hash,
        tenant_id,
        email_verified: false,
        is_active: true,
      });
      const saved = await this.userRepository.save(user);

      await this.emailService.sendWelcomeWithPassword(
        saved.email,
        saved.name,
        rawPassword,
      );

      return saved;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
    }
  }

  me(id: string, tenant_id: string): Promise<User[]> {
    return this.userRepository.find({
      where: { id, tenant_id },
    });
  }

  findAll(tenant_id: string): Promise<User[]> {
    return this.userRepository.find({
      where: { tenant_id },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, tenant_id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, tenant_id },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(
    id: string,
    tenant_id: string,
    dto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, tenant_id: tenant_id },
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);

    if (dto.password) {
      (user as UserType).password_hash = await bcrypt.hash(dto.password, 12);
      delete (dto as any).password;
    }
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async remove(id: string, tenant_id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        id,
        tenant_id,
      },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    await this.userRepository.remove(user);
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.email_verification_token')
      .where('user.email_verification_token = :token', { token })
      .getOne();

    if (!user) {
      throw new BadRequestException(
        'Token de verificação inválido ou expirado',
      );
    }

    await this.userRepository.update(user.id, {
      email_verified: true,
      is_active: true,
      email_verification_token: null,
    });

    return { message: 'Email confirmado com sucesso. Sua conta está ativa!' };
  }
}
