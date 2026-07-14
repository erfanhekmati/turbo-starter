import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from './user.response.dto';

export class LoginPasswordResponseDto {
  @ApiPropertyOptional()
  accessToken?: string;

  @ApiPropertyOptional()
  refreshToken?: string;

  @ApiPropertyOptional({ type: UserResponseDto })
  user?: UserResponseDto;

  @ApiProperty({ default: false })
  requires2fa!: boolean;

  @ApiPropertyOptional()
  mfaToken?: string;
}
