import { Tenant } from 'src/tenants/entities/tenant.entity';
import { Role } from '../enums/role.enum';

export type UserType = {
  id: string;
  tenant_id: string;
  tenant: Tenant;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};
