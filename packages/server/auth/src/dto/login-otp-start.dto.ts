import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class LoginOtpStartDto {
  @ApiProperty()
  @IsEmail()
  email!: string;
}
