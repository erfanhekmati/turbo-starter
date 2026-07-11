import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

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
  const isProduction = configService.getOrThrow<string>('app.nodeEnv');

  await app.listen(port);
  console.log(`API running at http://localhost:${port}`);

  if(!isProduction) {
    const swaggerPath = configService.get<string>('swagger.path', 'api-docs');
    console.log(`Swagger docs at http://localhost:${port}/${swaggerPath}`);
  }
}
bootstrap();