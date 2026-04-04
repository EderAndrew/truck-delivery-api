import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { GeoPointDto } from 'src/common/dto/geo-point.dto';

export class RegisterTenantDto {
  // — Dados da empresa —
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{14}$/, {
    message: 'cnpj deve conter exatamente 14 dígitos numéricos',
  })
  cnpj: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  company_email: string;

  @IsString()
  @IsNotEmpty()
  address_street: string;

  @IsString()
  @IsNotEmpty()
  address_number: string;

  @IsString()
  @IsNotEmpty()
  address_city: string;

  @IsString()
  @IsNotEmpty()
  address_state: string;

  @IsString()
  @IsNotEmpty()
  address_zip: string;

  @IsString()
  @IsOptional()
  country?: string;

  @ValidateNested()
  @Type(() => GeoPointDto)
  @IsOptional()
  origin_point?: GeoPointDto;

  // — Dados do administrador —
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  admin_name: string;

  @IsEmail()
  @IsNotEmpty()
  admin_email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  admin_password: string;
}
