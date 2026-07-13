import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = configureApp(app);
  const logger = new Logger('Bootstrap');

  const port = configService.getOrThrow<number>('app.port');
  const isProduction =
    configService.getOrThrow<string>('app.nodeEnv') === 'production';

  await app.listen(port);
  logger.log(`API running at http://localhost:${port}`);

  if (!isProduction) {
    const swaggerPath = configService.get<string>('swagger.path', 'api-docs');
    logger.log(`Swagger docs at http://localhost:${port}/${swaggerPath}`);
  }
}
bootstrap();
