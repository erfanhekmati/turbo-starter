import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RegisterVerifyEmailDto {
  @ApiProperty()
  @IsUUID()
  registrationId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code!: string;
}
