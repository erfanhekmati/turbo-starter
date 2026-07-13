import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@repo/auth';
import {
  MessageResponseDto,
  PasswordResetConfirmDto,
  PasswordResetSessionResponseDto,
  PasswordResetStartDto,
  PasswordResetVerifyDto,
} from '../dto';
import { PasswordResetService } from '../services/password-reset.service';

@ApiTags('auth/password-reset')
@Controller('auth/password-reset')
@Public()
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  async start(@Body() dto: PasswordResetStartDto): Promise<PasswordResetSessionResponseDto> {
    const resetId = await this.passwordResetService.start(dto.email);
    return { resetId };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() dto: PasswordResetVerifyDto,
  ): Promise<PasswordResetSessionResponseDto> {
    const resetId = await this.passwordResetService.verifyOtp(dto.resetId, dto.code);
    return { resetId };
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(@Body() dto: PasswordResetConfirmDto): Promise<MessageResponseDto> {
    await this.passwordResetService.confirm(dto.resetId, dto.password);
    return { message: 'Password has been reset successfully.' };
  }
}
