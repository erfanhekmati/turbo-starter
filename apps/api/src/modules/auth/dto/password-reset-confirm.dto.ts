import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword, IsUUID } from 'class-validator';
import { IsEqualTo } from './validators/is-equal-to.decorator';

export class PasswordResetConfirmDto {
  @ApiProperty()
  @IsUUID()
  resetId!: string;

  @ApiProperty()
  @IsStrongPassword()
  password!: string;

  @ApiProperty()
  @IsEqualTo('password', { message: 'confirmPassword must match password' })
  confirmPassword!: string;
}
