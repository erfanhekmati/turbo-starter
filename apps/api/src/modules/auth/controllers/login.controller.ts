import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '../../../common/decorators';
import {
  AuthTokensResponseDto,
  Login2faDto,
  LoginOtpStartDto,
  LoginOtpVerifyDto,
  LoginPasswordDto,
  LoginPasswordResponseDto,
  MessageResponseDto,
  toUserResponseDto,
} from '../dto';
import { AuthService, CookieService } from '../services';

@ApiTags('auth/login')
@Controller('auth/login')
@Public()
@Throttle({ default: { limit: 5, ttl: 60_000 } })
export class LoginController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
  ) {}

  @Post('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  async loginWithPassword(
    @Body() dto: LoginPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginPasswordResponseDto> {
    const result = await this.authService.loginWithPassword(
      dto.email,
      dto.password,
    );

    if (result.requires2fa) {
      return {
        requires2fa: true,
        mfaToken: result.mfaToken,
      };
    }

    this.cookieService.setAuthCookies(res, result.tokens);

    return {
      ...result.tokens,
      user: toUserResponseDto(result.user),
      requires2fa: false,
    };
  }

  @Post('2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete sign in with TOTP verification' })
  async loginWith2fa(
    @Body() dto: Login2faDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensResponseDto> {
    const { tokens, user } = await this.authService.loginWith2fa(
      dto.mfaToken,
      dto.code,
    );

    this.cookieService.setAuthCookies(res, tokens);

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
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensResponseDto> {
    const { tokens, user } = await this.authService.verifyOtpLogin(
      dto.email,
      dto.code,
    );

    this.cookieService.setAuthCookies(res, tokens);

    return {
      ...tokens,
      user: toUserResponseDto(user),
    };
  }
}
