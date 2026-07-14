import { ApiProperty } from '@nestjs/swagger';

export class TotpSetupResponseDto {
  @ApiProperty()
  secret!: string;

  @ApiProperty()
  otpauthUrl!: string;

  @ApiProperty()
  qrCodeDataUrl!: string;
}
