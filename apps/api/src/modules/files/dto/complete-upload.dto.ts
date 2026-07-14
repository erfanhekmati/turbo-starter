import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';

export class CompleteUploadDto {
  @ApiProperty()
  @IsString()
  key!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  mimeType!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(50 * 1024 * 1024)
  size!: number;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  originalName!: string;
}
