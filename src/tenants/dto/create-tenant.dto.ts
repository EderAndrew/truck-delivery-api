import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { GeoPointDto } from 'src/common/dto/geo-point.dto';

export class CreateTenantDto {
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
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address_street?: string;

  @IsString()
  @IsOptional()
  address_number?: string;

  @IsString()
  @IsOptional()
  address_city?: string;

  @IsString()
  @IsOptional()
  address_state?: string;

  @IsString()
  @IsOptional()
  address_zip?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ValidateNested()
  @Type(() => GeoPointDto)
  @IsOptional()
  origin_point?: GeoPointDto;
}
