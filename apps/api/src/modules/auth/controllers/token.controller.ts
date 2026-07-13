import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/decorators';
import { CurrentRefreshToken, CurrentUser } from '../decorators';
import {
  LogoutDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  toUserResponseDto,
  UserResponseDto,
} from '../dto';
import { JwtRefreshGuard } from '../guards';
import { AuthService, TokenService } from '../services';
import type { AuthenticatedUser, RefreshTokenPayload } from '../types';

@ApiTags('auth')
@Controller('auth')
export class TokenController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue a new token pair' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @CurrentRefreshToken() payload: RefreshTokenPayload,
  ): Promise<RefreshTokenResponseDto> {
    return this.tokenService.rotateRefreshToken(dto.refreshToken, payload);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('token/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the current refresh token' })
  async logout(@Body() dto: LogoutDto): Promise<void> {
    await this.tokenService.revokeRefreshToken(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  async me(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const user = await this.authService.getProfile(currentUser.id);
    return toUserResponseDto(user);
  }
}
