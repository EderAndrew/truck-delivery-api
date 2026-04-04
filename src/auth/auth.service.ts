/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from './config/jwt.config.js';
import { Request } from 'express';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.email = :email', { email: dto.email })
      .getOne();

    const invalid = new UnauthorizedException(
      'Credenciais inválidas ou conta inativa',
    );

    if (!user || !user.is_active || !user.email_verified) throw invalid;

    const passwordMatch = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    if (!passwordMatch) throw invalid;

    const accessToken = await this.signJwtAsync(
      user.tenant_id,
      user.id,
      user.role,
      'access',
      this.jwtConfiguration.jwtTtl,
    );

    const refreshToken = await this.signJwtAsync(
      user.tenant_id,
      user.id,
      user.role,
      'refresh',
      this.jwtConfiguration.refresh_jwtTtl,
    );

    return { accessToken, refreshToken };
  }

  async refresh(
    req: Request,
    refreshTokenBody: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = refreshTokenBody || req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token ausente.');
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.jwtConfiguration.secret,
      });
    } catch (error) {
      throw new UnauthorizedException(error);
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Token inválido.');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Usuário inválido.');
    }

    const accessToken = await this.signJwtAsync(
      user.tenant_id,
      user.id,
      user.role,
      'access',
      this.jwtConfiguration.jwtTtl,
    );

    const newRefreshToken = await this.signJwtAsync(
      user.tenant_id,
      user.id,
      user.role,
      'refresh',
      this.jwtConfiguration.refresh_jwtTtl,
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  private async signJwtAsync(
    tenant_id: string,
    sub: string,
    role: string,
    type: 'access' | 'refresh',
    expiresIn: number,
  ) {
    return await this.jwtService.signAsync(
      {
        tenant_id,
        sub,
        role,
        type,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );
  }
}
