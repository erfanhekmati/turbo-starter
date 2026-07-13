import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { createWinstonLogger } from '../logger';
import { setupSwagger } from '../swagger';

export function configureApp(app: INestApplication): ConfigService {
  const configService = app.get(ConfigService);
  const nodeEnv = configService.getOrThrow<string>('app.nodeEnv');
  const isProduction = nodeEnv === 'production';

  app.useLogger(createWinstonLogger(isProduction));
  app.use(helmet());

  const corsOrigins = configService.get<string[]>('app.corsOrigins');
  if (isProduction && (!corsOrigins || corsOrigins.length === 0)) {
    throw new Error('CORS_ORIGINS must be set in production');
  }
  app.enableCors({ origin: corsOrigins ?? true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableShutdownHooks();
  setupSwagger(app);

  return configService;
}
