import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Length } from 'class-validator';

export class RegisterVerifyEmailDto {
  @ApiProperty()
  @IsUUID()
  registrationId!: string;

  @ApiProperty()
  @IsString()
  @Length(6, 6)
  code!: string;
}
