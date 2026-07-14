import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
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
import { AuthService, CookieService, TokenService } from '../services';
import type { AuthenticatedUser, RefreshTokenPayload } from '../types';
import { extractRefreshToken } from '../utils/jwt-extractors.util';

@ApiTags('auth')
@Controller('auth')
export class TokenController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
  ) {}

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue a new token pair' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentRefreshToken() payload: RefreshTokenPayload,
  ): Promise<RefreshTokenResponseDto> {
    const refreshToken = extractRefreshToken(req) ?? dto.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const tokens = await this.tokenService.rotateRefreshToken(
      refreshToken,
      payload,
    );
    this.cookieService.setAuthCookies(res, tokens);
    return tokens;
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('token/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke the current refresh token' })
  async logout(
    @Body() dto: LogoutDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = extractRefreshToken(req) ?? dto.refreshToken;
    if (refreshToken) {
      await this.tokenService.revokeRefreshToken(refreshToken);
    }
    this.cookieService.clearAuthCookies(res);
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
