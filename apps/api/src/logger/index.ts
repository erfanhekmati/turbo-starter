import { WinstonModule, utilities as nestWinstonUtilities } from 'nest-winston';
import * as winston from 'winston';

export function createWinstonLogger(isProduction: boolean) {
  return WinstonModule.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: isProduction
      ? winston.format.combine(winston.format.timestamp(), winston.format.json())
      : winston.format.combine(
          winston.format.timestamp(),
          nestWinstonUtilities.format.nestLike('API', {
            colors: true,
            prettyPrint: true,
          }),
        ),
    transports: [new winston.transports.Console()],
  });
}
