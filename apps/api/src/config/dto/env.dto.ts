import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Environment } from '../enums';

export class EnvDto {
  @IsOptional()
  @IsEnum(Environment)
  NODE_ENV?: Environment;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT?: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_TTL?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_TTL?: string;

  @IsString()
  @IsNotEmpty()
  OTP_HASH_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  SMTP_HOST!: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  SMTP_PORT!: number;

  @IsString()
  @IsNotEmpty()
  SMTP_USER!: string;

  @IsString()
  @IsNotEmpty()
  SMTP_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  SMTP_FROM!: string;

  @IsOptional()
  @IsBoolean()
  SMTP_SECURE?: boolean;
}
