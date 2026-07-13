import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetSessionResponseDto {
  @ApiProperty()
  resetId!: string;
}
