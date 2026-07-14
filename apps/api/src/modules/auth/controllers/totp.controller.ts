import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators';
import {
  TotpConfirmDto,
  TotpSetupResponseDto,
  TotpStatusResponseDto,
} from '../dto';
import { TotpService } from '../services/totp.service';
import type { AuthenticatedUser } from '../types';

@ApiTags('auth/totp')
@ApiBearerAuth()
@Controller('auth/totp')
export class TotpController {
  constructor(private readonly totpService: TotpService) {}

  @Post('setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start TOTP setup for the current user' })
  setup(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TotpSetupResponseDto> {
    return this.totpService.setup(currentUser.id);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm and enable TOTP for the current user' })
  async confirm(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: TotpConfirmDto,
  ): Promise<TotpStatusResponseDto> {
    await this.totpService.confirm(currentUser.id, dto.code);
    return {
      totpEnabled: true,
      message: 'Two-factor authentication enabled',
    };
  }

  @Post('disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable TOTP for the current user' })
  async disable(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<TotpStatusResponseDto> {
    await this.totpService.disable(currentUser.id);
    return {
      totpEnabled: false,
      message: 'Two-factor authentication disabled',
    };
  }
}
