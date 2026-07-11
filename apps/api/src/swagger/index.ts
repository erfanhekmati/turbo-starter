import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerTheme } from 'swagger-themes';

export function setupSwagger(app: INestApplication<any>) {
  const configService = app.get(ConfigService);

  const nodeEnv = configService.getOrThrow<string>('app.nodeEnv');
  if (nodeEnv === 'production') {
    return;
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.getOrThrow<string>('swagger.title'))
    .setDescription(configService.getOrThrow<string>('swagger.description'))
    .setVersion(configService.getOrThrow<string>('app.version'))
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  
  const theme = new SwaggerTheme();

  const swaggerOptions = {
    swaggerOptions: {
      operationsSorter: (
        a: { get: (str: string) => string },
        b: { get: (str: string) => string },
      ) => {
        const methodsOrder = [
          'get',
          'post',
          'put',
          'patch',
          'delete',
          'options',
          'trace',
        ];
        let result =
          methodsOrder.indexOf(a.get('method')) -
          methodsOrder.indexOf(b.get('method'));
        if (result === 0) result = a.get('path').localeCompare(b.get('path'));
        return result;
      },
    },
    explorer: true,
    customCss: theme.getBuffer(configService.getOrThrow<string>('swagger.theme') as any),
  };

  SwaggerModule.setup(
    configService.getOrThrow<string>('swagger.path'),
    app,
    swaggerDocument,
    swaggerOptions,
  );
}