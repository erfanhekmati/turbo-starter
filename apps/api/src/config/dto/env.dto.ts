import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
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

  @ValidateIf(
    (env: EnvDto) =>
      env.NODE_ENV === Environment.Production || Boolean(env.CORS_ORIGINS),
  )
  @IsString()
  @IsNotEmpty()
  CORS_ORIGINS?: string;

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

  @IsOptional()
  @IsNumber()
  @Min(4)
  @Max(12)
  OTP_LENGTH?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  OTP_TTL_MINUTES?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  OTP_RESEND_COOLDOWN_SECONDS?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  OTP_MAX_SENDS_PER_WINDOW?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  OTP_SEND_WINDOW_MINUTES?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  OTP_MAX_VERIFY_ATTEMPTS?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  REGISTRATION_SESSION_TTL_MINUTES?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  PASSWORD_RESET_SESSION_TTL_MINUTES?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  LOGIN_LOCKOUT_THRESHOLD?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  LOGIN_LOCKOUT_MINUTES?: number;

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
