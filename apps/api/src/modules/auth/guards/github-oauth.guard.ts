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
export class GitHubOAuthGuard extends AuthGuard('github') implements CanActivate {
  constructor(private readonly config: ConfigService) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (
      !this.config.get<string>('oauth.githubClientId') ||
      !this.config.get<string>('oauth.githubClientSecret')
    ) {
      throw new NotImplementedException('GitHub OAuth is not configured');
    }

    return super.canActivate(context);
  }

  getAuthenticateOptions() {
    return {
      scope: ['user:email'],
      session: false,
    };
  }
}
