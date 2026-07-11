import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export function createWinstonLogger(isProduction: boolean) {
  return WinstonModule.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: isProduction
      ? winston.format.combine(winston.format.timestamp(), winston.format.json())
      : winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context }) => {
            return `${timestamp} [${context ?? 'Nest'}] ${level}: ${message}`;
          }),
        ),
    transports: [new winston.transports.Console()],
  });
}
