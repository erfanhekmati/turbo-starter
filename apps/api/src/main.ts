import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';
import { createWinstonLogger } from './logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);

  const isProduction =
    configService.getOrThrow<string>('app.nodeEnv') === 'production';

  app.useLogger(createWinstonLogger(isProduction));
  const logger = new Logger('Bootstrap');

  app.use(helmet());

  const corsOrigins = configService.get<string[]>('app.corsOrigins');
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

  setupSwagger(app);

  const port = configService.getOrThrow<number>('app.port');

  await app.listen(port);
  logger.log(`API running at http://localhost:${port}`);

  if (!isProduction) {
    const swaggerPath = configService.get<string>('swagger.path', 'api-docs');
    logger.log(`Swagger docs at http://localhost:${port}/${swaggerPath}`);
  }
}
bootstrap();
