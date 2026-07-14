import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    description: 'Optional when refresh_token cookie is present',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
