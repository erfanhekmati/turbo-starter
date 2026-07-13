import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/decorators';
import {
  AuthTokensResponseDto,
  LoginOtpStartDto,
  LoginOtpVerifyDto,
  LoginPasswordDto,
  MessageResponseDto,
  toUserResponseDto,
} from '../dto';
import { AuthService } from '../services';

@ApiTags('auth/login')
@Controller('auth/login')
@Public()
@Throttle({ default: { limit: 5, ttl: 60_000 } })
export class LoginController {
  constructor(private readonly authService: AuthService) {}

  @Post('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  async loginWithPassword(
    @Body() dto: LoginPasswordDto,
  ): Promise<AuthTokensResponseDto> {
    const { tokens, user } = await this.authService.loginWithPassword(
      dto.email,
      dto.password,
    );

    return {
      ...tokens,
      user: toUserResponseDto(user),
    };
  }

  @Post('otp/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a one-time login code' })
  async startOtpLogin(
    @Body() dto: LoginOtpStartDto,
  ): Promise<MessageResponseDto> {
    await this.authService.startOtpLogin(dto.email);
    return {
      message:
        'If an account exists for this email, a verification code has been sent.',
    };
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a one-time login code' })
  async verifyOtpLogin(
    @Body() dto: LoginOtpVerifyDto,
  ): Promise<AuthTokensResponseDto> {
    const { tokens, user } = await this.authService.verifyOtpLogin(
      dto.email,
      dto.code,
    );

    return {
      ...tokens,
      user: toUserResponseDto(user),
    };
  }
}
