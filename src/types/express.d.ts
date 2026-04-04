import 'express';

declare module 'express' {
  interface Request {
    user?: {
      id: string;
      tenant_id: string;
    };
    cookies: {
      access_token?: string;
    };
  }
}
