import { join } from 'path';
import { fastifyAuth } from '@fastify/auth';
import { fastifyAutoload } from '@fastify/autoload';
import { fastifyCookie } from '@fastify/cookie';
import { fastifyOauth2, type OAuth2Namespace } from '@fastify/oauth2';
import fastifyApp from 'fastify';
import { config } from '../config';
import type { ICallbackPluginOptions } from './api/oauth/callback';
import servicesPlugins from './services/services.plugin';

export const app = fastifyApp({
  ...config.server.options,
});

declare module 'fastify' {
  interface FastifyInstance {
    /** OAuth2 interface */
    gitlabOAuth2: OAuth2Namespace;
  }
}

export async function start(): Promise<void> {
  await app.register(fastifyCookie);
  await app.register(fastifyAuth);
  await app.register(fastifyOauth2, {
    ...config.plugins.oauth2,
    scope: ['read_user', 'openid', 'profile', 'email'],
  });

  await app.register(fastifyAutoload, {
    dir: join(__dirname, 'plugins'),
    dirNameRoutePrefix: false,
    options: { ...config.plugins },
  });

  await app.register(servicesPlugins, config.services);

  await app.register(fastifyAutoload, {
    dir: join(__dirname, 'api'),
    dirNameRoutePrefix: false,
    options: { ...config.api } as ICallbackPluginOptions,
  });

  await app.ready();

  await app.listen({ ...config.server });
  return;
}

export async function stop(): Promise<void> {
  return app.close();
}
