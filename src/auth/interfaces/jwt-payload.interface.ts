import { Role } from '../../common/enums/role.enum.js';

export interface JwtPayload {
  sub: string;
  tenant_id: string;
  role: Role;
  type?: 'access' | 'refresh';
}
