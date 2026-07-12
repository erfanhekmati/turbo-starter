import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { IsEqualTo } from './validators/is-equal-to.decorator';

export class RegisterCompleteDto {
  @ApiProperty()
  @IsUUID()
  registrationId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty()
  @IsStrongPassword()
  password!: string;

  @ApiProperty()
  @IsEqualTo('password', { message: 'confirmPassword must match password' })
  confirmPassword!: string;
}
