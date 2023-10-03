import { pino, type LoggerOptions } from 'pino';
import { config, Environments } from '../config';

const options: LoggerOptions = {
  level: (config.server.options.logger as LoggerOptions).level ?? 'info',
  ...(config.env === Environments.DEVELOPMENT
    ? {
        transport: {
          target: 'pino-pretty',
        },
      }
    : {}),
};

export const logger = pino(options).child({ app: config.server.name });
