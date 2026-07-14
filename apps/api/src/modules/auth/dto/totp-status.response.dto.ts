import { ApiProperty } from '@nestjs/swagger';

export class TotpStatusResponseDto {
  @ApiProperty()
  totpEnabled!: boolean;

  @ApiProperty()
  message!: string;
}
