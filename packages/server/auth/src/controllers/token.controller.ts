import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@repo/database';
import { plainToInstance } from 'class-transformer';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { LogoutDto } from '../dto/logout.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RefreshTokenResponseDto } from '../dto/refresh-token.response.dto';
import { UserResponseDto } from '../dto/user.response.dto';
import { TokenService } from '../services/token.service';
import type { AuthenticatedUser } from '../types/authenticated-user.type';

@ApiTags('auth')
@Controller('auth')
export class TokenController {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    return this.tokenService.rotateRefreshToken(dto.refreshToken);
  }

  @Public()
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
