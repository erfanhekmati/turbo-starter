import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/decorators';
import {
  MessageResponseDto,
  PasswordResetConfirmDto,
  PasswordResetSessionResponseDto,
  PasswordResetStartDto,
  PasswordResetVerifyDto,
} from '../dto';
import { PasswordResetService } from '../services';

@ApiTags('auth/password-reset')
@Controller('auth/password-reset')
@Public()
@Throttle({ default: { limit: 5, ttl: 60_000 } })
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start password reset (anti-enumeration)' })
  async start(
    @Body() dto: PasswordResetStartDto,
  ): Promise<PasswordResetSessionResponseDto> {
    const resetId = await this.passwordResetService.start(dto.email);
    return { resetId };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify password-reset OTP' })
  async verifyOtp(
    @Body() dto: PasswordResetVerifyDto,
  ): Promise<PasswordResetSessionResponseDto> {
    const resetId = await this.passwordResetService.verifyOtp(
      dto.resetId,
      dto.code,
    );
    return { resetId };
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a new password after OTP verification' })
  async confirm(
    @Body() dto: PasswordResetConfirmDto,
  ): Promise<MessageResponseDto> {
    await this.passwordResetService.confirm(dto.resetId, dto.password);
    return { message: 'Password has been reset successfully.' };
  }
}
