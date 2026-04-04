import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from './decorators/public.decorator.js';
import { setAuthCookies } from './cookie.helper.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(dto);

    const isMobile = req.headers['x-platform'] === 'mobile';

    if (isMobile) {
      return { accessToken, refreshToken };
    }

    setAuthCookies(res, accessToken, refreshToken);
    return { message: 'Login realizado.' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body('refreshToken') refreshTokenBody: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.refresh(
      req,
      refreshTokenBody,
    );

    const isMobile = req.headers['x-platform'] === 'mobile';

    if (isMobile) {
      return { accessToken, refreshToken };
    }

    setAuthCookies(res, accessToken, refreshToken);
    return { message: 'Token renovado.' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/auth/refresh' });
    return { message: 'Logout realizado.' };
  }
}
