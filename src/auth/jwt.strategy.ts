import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) =>
          (req?.cookies as Record<string, string | undefined>)?.access_token ??
          null,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'change-me-in-production',
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    if (!payload.sub || !payload.tenant_id || !payload.role) {
      throw new UnauthorizedException('Token inválido');
    }
    return {
      sub: payload.sub,
      tenant_id: payload.tenant_id,
      role: payload.role,
    };
  }
}
