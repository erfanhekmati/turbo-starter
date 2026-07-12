import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Length } from 'class-validator';

export class PasswordResetVerifyDto {
  @ApiProperty()
  @IsUUID()
  resetId!: string;

  @ApiProperty()
  @IsString()
  @Length(6, 6)
  code!: string;
}
