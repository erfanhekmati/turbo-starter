import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class PasswordResetStartDto {
  @ApiProperty()
  @IsEmail()
  email!: string;
}
