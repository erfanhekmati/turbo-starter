import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Public } from '../decorators/public.decorator';
import { AuthTokensResponseDto } from '../dto/auth-tokens.response.dto';
import { RegisterCompleteDto } from '../dto/register-complete.dto';
import { RegisterStartDto } from '../dto/register-start.dto';
import { RegisterVerifyEmailDto } from '../dto/register-verify-email.dto';
import { RegistrationSessionResponseDto } from '../dto/registration-session.response.dto';
import { UserResponseDto } from '../dto/user.response.dto';
import { RegistrationService } from '../services/registration.service';

@ApiTags('auth/register')
@Controller('auth/register')
@Public()
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  async start(@Body() dto: RegisterStartDto): Promise<RegistrationSessionResponseDto> {
    const registrationId = await this.registrationService.start(dto.email);
    return { registrationId };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
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
  async complete(@Body() dto: RegisterCompleteDto): Promise<AuthTokensResponseDto> {
    const { tokens, user } = await this.registrationService.complete(
      dto.registrationId,
      dto.firstName,
      dto.lastName,
      dto.password,
    );

    return {
      ...tokens,
      user: plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true }),
    };
  }
}
