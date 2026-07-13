import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class PasswordResetVerifyDto {
  @ApiProperty()
  @IsUUID()
  resetId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code!: string;
}
