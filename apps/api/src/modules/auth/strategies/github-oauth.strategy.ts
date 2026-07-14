import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';
import type { OAuthUserProfile } from './google-oauth.strategy';

type DoneCallback = (error: Error | null, user?: OAuthUserProfile | false) => void;

@Injectable()
export class GitHubOAuthStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('oauth.githubClientId') ?? 'disabled',
      clientSecret: config.get<string>('oauth.githubClientSecret') ?? 'disabled',
      callbackURL: `${config.getOrThrow<string>(
        'oauth.callbackBaseUrl',
      )}/auth/oauth/github/callback`,
      scope: ['user:email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: DoneCallback,
  ): void {
    const email = profile.emails?.find((entry) => entry.value)?.value;
    if (!email) {
      done(new UnauthorizedException('GitHub account email is required'), false);
      return;
    }

    const [firstName, ...rest] = (profile.displayName || profile.username || 'GitHub User')
      .trim()
      .split(/\s+/);

    done(null, {
      provider: 'github',
      providerAccountId: profile.id,
      email,
      firstName: firstName || 'GitHub',
      lastName: rest.join(' ') || 'User',
    } satisfies OAuthUserProfile);
  }
}
