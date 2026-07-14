import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') implements CanActivate {
  constructor(private readonly config: ConfigService) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (
      !this.config.get<string>('oauth.googleClientId') ||
      !this.config.get<string>('oauth.googleClientSecret')
    ) {
      throw new NotImplementedException('Google OAuth is not configured');
    }

    return super.canActivate(context);
  }

  getAuthenticateOptions() {
    return {
      scope: ['email', 'profile'],
      session: false,
    };
  }
}
