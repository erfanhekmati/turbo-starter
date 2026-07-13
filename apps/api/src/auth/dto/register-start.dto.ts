import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RegisterStartDto {
  @ApiProperty()
  @IsEmail()
  email!: string;
}
