import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

export type OAuthUserProfile = {
  provider: 'google';
  providerAccountId: string;
  email: string;
  firstName: string;
  lastName: string;
};

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('oauth.googleClientId') ?? 'disabled',
      clientSecret: config.get<string>('oauth.googleClientSecret') ?? 'disabled',
      callbackURL: `${config.getOrThrow<string>(
        'oauth.callbackBaseUrl',
      )}/auth/oauth/google/callback`,
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new UnauthorizedException('Google account email is required'), false);
      return;
    }

    done(null, {
      provider: 'google',
      providerAccountId: profile.id,
      email,
      firstName: profile.name?.givenName ?? profile.displayName ?? 'Google',
      lastName: profile.name?.familyName ?? 'User',
    } satisfies OAuthUserProfile);
  }
}
