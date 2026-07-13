import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@repo/auth';
import { plainToInstance } from 'class-transformer';
import { AuthTokensResponseDto } from '../dto/auth-tokens.response.dto';
import { LoginOtpStartDto } from '../dto/login-otp-start.dto';
import { LoginOtpVerifyDto } from '../dto/login-otp-verify.dto';
import { LoginPasswordDto } from '../dto/login-password.dto';
import { MessageResponseDto } from '../dto/message.response.dto';
import { UserResponseDto } from '../dto/user.response.dto';
import { AuthService } from '../services/auth.service';

@ApiTags('auth/login')
@Controller('auth/login')
@Public()
export class LoginController {
  constructor(private readonly authService: AuthService) {}

  @Post('password')
  @HttpCode(HttpStatus.OK)
  async loginWithPassword(@Body() dto: LoginPasswordDto): Promise<AuthTokensResponseDto> {
    const { tokens, user } = await this.authService.loginWithPassword(
      dto.email,
      dto.password,
    );

    return {
      ...tokens,
      user: plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }),
    };
  }

  @Post('otp/start')
  @HttpCode(HttpStatus.OK)
  async startOtpLogin(@Body() dto: LoginOtpStartDto): Promise<MessageResponseDto> {
    await this.authService.startOtpLogin(dto.email);
    return {
      message: 'If an account exists for this email, a verification code has been sent.',
    };
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtpLogin(@Body() dto: LoginOtpVerifyDto): Promise<AuthTokensResponseDto> {
    const { tokens, user } = await this.authService.verifyOtpLogin(dto.email, dto.code);

    return {
      ...tokens,
      user: plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }),
    };
  }
}
