import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/decorators';
import {
  AuthTokensResponseDto,
  RegisterCompleteDto,
  RegisterStartDto,
  RegisterVerifyEmailDto,
  RegistrationSessionResponseDto,
  toUserResponseDto,
} from '../dto';
import { RegistrationService } from '../services';

@ApiTags('auth/register')
@Controller('auth/register')
@Public()
@Throttle({ default: { limit: 5, ttl: 60_000 } })
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start registration and send email verification OTP' })
  async start(
    @Body() dto: RegisterStartDto,
  ): Promise<RegistrationSessionResponseDto> {
    const registrationId = await this.registrationService.start(dto.email);
    return { registrationId };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify registration email OTP' })
  async verifyEmail(
    @Body() dto: RegisterVerifyEmailDto,
  ): Promise<RegistrationSessionResponseDto> {
    const registrationId = await this.registrationService.verifyEmail(
      dto.registrationId,
      dto.code,
    );
    return { registrationId };
  }

  @Post('complete')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Complete registration and issue tokens' })
  async complete(
    @Body() dto: RegisterCompleteDto,
  ): Promise<AuthTokensResponseDto> {
    const { tokens, user } = await this.registrationService.complete(
      dto.registrationId,
      dto.firstName,
      dto.lastName,
      dto.password,
    );

    return {
      ...tokens,
      user: toUserResponseDto(user),
    };
  }
}
