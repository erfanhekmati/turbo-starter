import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@repo/database';
import { plainToInstance } from 'class-transformer';
import { CurrentRefreshToken, CurrentUser, Public } from '../decorators';
import {
  LogoutDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  UserResponseDto,
} from '../dto';
import { JwtRefreshGuard } from '../guards';
import { TokenService } from '../services';
import type { AuthenticatedUser, RefreshTokenPayload } from '../types';

@ApiTags('auth')
@Controller('auth')
export class TokenController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @CurrentRefreshToken() payload: RefreshTokenPayload,
  ): Promise<RefreshTokenResponseDto> {
    return this.tokenService.rotateRefreshToken(dto.refreshToken, payload);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('token/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: LogoutDto): Promise<void> {
    await this.tokenService.revokeRefreshToken(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Get('me')
  async me(@CurrentUser() currentUser: AuthenticatedUser): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: currentUser.id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
  }
}
