import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class TotpConfirmDto {
  @ApiProperty()
  @IsString()
  @MinLength(6)
  @MaxLength(8)
  code!: string;
}
