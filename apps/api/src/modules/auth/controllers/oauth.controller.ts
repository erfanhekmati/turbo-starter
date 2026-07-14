import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Public } from '../../../common/decorators';
import { GoogleOAuthGuard } from '../guards';
import { AuthService, CookieService } from '../services';
import type { OAuthUserProfile } from '../strategies/google-oauth.strategy';

type OAuthRequest = Request & { user: OAuthUserProfile };

@ApiTags('auth/oauth')
@Controller('auth/oauth')
@Public()
export class OAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
    private readonly config: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Redirect to Google OAuth login' })
  google(): void {}

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Handle the Google OAuth callback' })
  async googleCallback(
    @Req() req: OAuthRequest,
    @Res() res: Response,
  ): Promise<void> {
    await this.completeOAuthLogin(req, res);
  }

  private async completeOAuthLogin(
    req: OAuthRequest,
    res: Response,
  ): Promise<void> {
    const { tokens } = await this.authService.loginWithOAuth(req.user);
    this.cookieService.setAuthCookies(res, tokens);
    res.redirect(this.config.getOrThrow<string>('oauth.successRedirect'));
  }
}
