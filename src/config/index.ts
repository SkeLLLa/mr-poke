import { fastifyOauth2, type FastifyOAuth2Options } from '@fastify/oauth2';
import * as dotenv from 'dotenv';
import type { FastifyServerOptions } from 'fastify';
import type { PinoLoggerOptions } from 'fastify/types/logger';
import { boolean, newConfig, number, string } from 'ts-app-env';
import type { IGitlabServiceOptions } from '../app/services/gitlab/gitlab.service';
import type { ISlackServiceOptions } from '../app/services/slack/slack.service';

dotenv.config();

export const enum Environments {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  STAGING = 'staging',
  PRODUCTION = 'productiion',
}

const { env, name } = newConfig(
  {
    env: string({
      env: 'NODE_ENV',
      default: 'development',
    }),
    name: string({
      env: 'NAME',
      default: 'mr-poke',
    }),
  },
  process.env,
);

const server = {
  port: number({
    env: 'SERVER_PORT',
    default: 3000,
  }),
  host: string({
    env: 'SERVER_HOST',
    default: '0.0.0.0',
  }),
  name,
  version: string({
    env: 'VERSION',
    default: '0.0.0',
  }),
  options: {
    requestIdHeader: 'x-request-id',
    trustProxy: true,
    requestTimeout: number({
      env: 'SERVER_REQUEST_TIMEOUT',
      default: 30000,
    }),
    disableRequestLogging: boolean({
      env: 'SERVER_REQUEST_LOGGING_DISABLED',
      default: true,
      notNeededIn: Environments.DEVELOPMENT,
    }),
    logger: {
      enabled: boolean({
        env: 'LOG_ENABLED',
        default: true,
      }),
      level: string({
        env: 'LOG_LEVEL',
        default: 'info',
      }),
      ...(env === Environments.DEVELOPMENT
        ? {
            transport: {
              target: 'pino-pretty',
            },
          }
        : {}),
      // transport: boolean({
      //   env: 'LOG_PERTTY_PRINT',
      //   notNeededIn: [Environments.TESTING, Environments.STAGING, Environments.PRODUCTION],
      // })
      //   ? {
      //       target: 'pino-pretty',
      //     }
      //   : undefined,
    } as PinoLoggerOptions,
  } as FastifyServerOptions,
};

const api = {
  callbackRoute: string({
    env: 'OAUTH2_CALLBACK_ROUTE',
    default: '/login/gitlab/callback',
  }),
};

const plugins = {
  oauth2: {
    name: 'gitlabOAuth2',
    credentials: {
      client: {
        id: string({
          env: 'GL_CLIENT_ID',
        }),
        secret: string({
          env: 'GL_CLIENT_SECRET',
        }),
      },
      auth: fastifyOauth2.GITLAB_CONFIGURATION,
    },
    startRedirectPath: string({
      env: 'OAUTH2_LOGIN_PATH',
      default: '/login/gitlab',
    }),
    callbackUri: string({
      env: 'OAUTH2_CALLBACK_URI',
    }),
    cookie: {
      secure: true,
      sameSite: 'none',
    },
  } as FastifyOAuth2Options,
};

const services = {
  gitlab: {
    token: string({
      env: 'GL_ACCESS_TOKEN',
    }),
    host: string({
      env: 'GL_HOST',
      optional: true,
    }),
  } as IGitlabServiceOptions,
  slack: {
    token: string({
      env: 'SLACK_TOKEN',
    }),
    slackApiUrl: string({
      env: 'SLACK_API_URL',
      optional: true,
    }),
  } as ISlackServiceOptions,
};

const configuration = {
  env,
  server,
  plugins,
  services,
  api,
};

export const config = newConfig(configuration, process.env, { nodeEnv: env });
