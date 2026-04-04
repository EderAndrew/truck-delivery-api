import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;
  private readonly appUrl: string;

  constructor() {
    this.from = process.env.EMAIL_FROM ?? 'noreply@cimento.app';
    this.appUrl = process.env.APP_URL ?? 'http://localhost:3000';

    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT ?? '587', 10),
      secure: Boolean(process.env.SMTP_SECURE),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendWelcomeWithPassword(
    to: string,
    name: string,
    password: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"No Reply" <${this.from}>`,
        to,
        subject: 'Bem-vindo ao Cimento SaaS — Sua senha de acesso',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Olá, ${name}!</h2>
            <p>Sua conta foi criada com sucesso. Use as credenciais abaixo para acessar o sistema:</p>
            <div style="background: #f4f4f4; border-radius: 6px; padding: 16px 24px; margin: 24px 0;">
              <p style="margin: 0;"><strong>Email:</strong> ${to}</p>
              <p style="margin: 8px 0 0;"><strong>Senha temporária:</strong> <span style="font-size: 20px; letter-spacing: 4px;">${password}</span></p>
            </div>
            <p>Recomendamos que você altere sua senha após o primeiro acesso.</p>
            <hr style="margin-top: 32px;" />
            <p style="font-size: 12px; color: #999;">Se você não solicitou este cadastro, entre em contato com o suporte.</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`Falha ao enviar email de boas-vindas para ${to}`, err);
    }
  }

  async sendEmailVerification(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const verifyUrl = `${this.appUrl}/users/verify-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: `"No Reply" <${this.from}>`,
        to,
        subject: 'Confirme seu cadastro — Cimento SaaS',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Olá, ${name}!</h2>
            <p>Sua empresa foi cadastrada com sucesso. Para ativar sua conta de administrador, clique no botão abaixo:</p>
            <p style="text-align: center; margin: 32px 0;">
              <a href="${verifyUrl}"
                 style="background: #1a56db; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                Confirmar email
              </a>
            </p>
            <p>Ou copie e cole o link abaixo no seu navegador:</p>
            <p style="word-break: break-all; color: #555;">${verifyUrl}</p>
            <hr style="margin-top: 32px;" />
            <p style="font-size: 12px; color: #999;">Se você não solicitou este cadastro, ignore este email.</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`Falha ao enviar email de verificação para ${to}`, err);
    }
  }
}
