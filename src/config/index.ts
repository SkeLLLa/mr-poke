import { fastifyOauth2, type FastifyOAuth2Options } from '@fastify/oauth2';
import * as dotenv from 'dotenv';
import type { FastifyServerOptions } from 'fastify';
import type { PinoLoggerOptions } from 'fastify/types/logger';
import { boolean, newConfig, number, string } from 'ts-app-env';
import type { IGitlabServiceOptions } from '../app/services/gitlab/gitlab.service';
import type { IReminderServiceOptions } from '../app/services/reminder/reminder.service';
import type { ISlackServiceOptions } from '../app/services/slack/slack.service';
import type { IUsersServiceOptions } from '../app/services/users/users.service';

dotenv.config();

export const enum Environments {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  STAGING = 'staging',
  PRODUCTION = 'productiion',
}

const { env, name } = newConfig(
  {
    // Runtime environment
    env: string({
      env: 'NODE_ENV',
      default: 'development',
    }),
    // Application name
    name: string({
      env: 'NAME',
      default: 'mr-poke',
    }),
  },
  process.env,
);

const server = {
  // Server port
  port: number({
    env: 'SERVER_PORT',
    default: 80,
  }),
  // Server host
  host: string({
    env: 'SERVER_HOST',
    default: '0.0.0.0',
  }),
  name,
  // Application version
  version: string({
    env: 'VERSION',
    default: '0.0.0',
  }),
  options: {
    requestIdHeader: 'x-request-id',
    trustProxy: true,
    // Server request timeout
    requestTimeout: number({
      env: 'SERVER_REQUEST_TIMEOUT',
      default: 30000,
    }),
    // Disable logging of each http request to server
    disableRequestLogging: boolean({
      env: 'SERVER_REQUEST_LOGGING_DISABLED',
      default: true,
      notNeededIn: Environments.DEVELOPMENT,
    }),
    logger: {
      // Logging switch
      enabled: boolean({
        env: 'LOG_ENABLED',
        default: true,
      }),
      // Log level
      level: string({
        env: 'LOG_LEVEL',
        default: 'info',
      }),
      // Pretty-print logs during local development
      ...((env as Environments) === Environments.DEVELOPMENT
        ? {
            transport: {
              target: 'pino-pretty',
            },
          }
        : {}),
    } as PinoLoggerOptions,
  } as FastifyServerOptions,
};

const api = {
  // OAuth2 callback route
  callbackRoute: string({
    env: 'OAUTH2_CALLBACK_ROUTE',
    default: '/login/gitlab/callback',
  }),
  // Gitlab hook route to receive events
  gitlabHookRoute: string({
    env: 'GL_HOOK_ROUTE',
    default: '/hooks/gitlab',
  }),
};

const plugins = {
  // Prisma configuration
  prisma: {
    // Database connection string
    url: string({
      env: 'DATABASE_URL',
    }),
    // Enable if connecting through PGBouncer
    pgbouncer: boolean({
      env: 'PG_BOUNCER_ENABLED',
      default: false,
    }),
    // Database ssl mode
    sslmode: string({
      env: 'PG_SSL_MODE',
      default: 'require',
    }),
  },
  // Gitlab configuration
  gitlab: {
    // Gitlab webhook verification token
    token: string({
      env: 'GL_HOOK_TOKEN',
    }),
  },
  // OAuth2 provider config
  oauth2: {
    name: 'gitlabOAuth2',
    credentials: {
      client: {
        // Gitlab application id
        id: string({
          env: 'GL_CLIENT_ID',
        }),
        // Gitlab application secret
        secret: string({
          env: 'GL_CLIENT_SECRET',
        }),
      },
      auth: fastifyOauth2.GITLAB_CONFIGURATION,
    },
    // Login start page path
    startRedirectPath: string({
      env: 'OAUTH2_LOGIN_PATH',
      default: '/login/gitlab',
    }),
    // Callback URI (host + OAuth2 callback route)
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
    // Gitlab access token for non-user related requests
    token: string({
      env: 'GL_ACCESS_TOKEN',
    }),
    // Gitlab instance host, defaults to https://gitlab.com
    host: string({
      env: 'GL_HOST',
      optional: true,
    }),
  } as IGitlabServiceOptions,
  // Slack config
  slack: {
    // Slack bot token
    token: string({
      env: 'SLACK_TOKEN',
    }),
    // Slack API url override
    slackApiUrl: string({
      env: 'SLACK_API_URL',
      optional: true,
    }),
    // Email domain filter, reduces API calls to slack API to find user by emial
    emailDomains: string({
      env: 'SLACK_EMAIL_DOMAINS',
      optional: true,
    }),
  } as ISlackServiceOptions,
  users: {} as IUsersServiceOptions,
  reminder: {} as IReminderServiceOptions,
};

const configuration = {
  env,
  server,
  plugins,
  services,
  api,
};

export const config = newConfig(configuration, process.env, { nodeEnv: env });
