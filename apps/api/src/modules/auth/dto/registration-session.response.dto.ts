import { ApiProperty } from '@nestjs/swagger';

export class RegistrationSessionResponseDto {
  @ApiProperty()
  registrationId!: string;
}
