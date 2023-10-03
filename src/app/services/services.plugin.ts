import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { GitlabService, IGitlabServiceOptions } from './gitlab/gitlab.service';
import { ISlackServiceOptions, SlackService } from './slack/slack.service';

export interface PluginOptions {
  gitlab: IGitlabServiceOptions;
  slack: ISlackServiceOptions;
}

export interface IServices {
  gitlab: GitlabService;
  slack: SlackService;
}

declare module 'fastify' {
  interface FastifyInstance {
    services: IServices;
  }
}

const servicesPlugins: FastifyPluginAsync<PluginOptions> = async function servicesPlugins(
  app: FastifyInstance,
  options: PluginOptions,
) {
  const { log } = app;

  // Providers
  // const userProvider = new UserProvider({ log });

  // Services
  const gitlabService = new GitlabService({ log, options: options.gitlab });
  const slackService = new SlackService({ log, options: options.slack });

  // Decorate
  app.decorate('services', {
    gitlab: gitlabService,
    slack: slackService,
  });
};

export default fp(servicesPlugins, {
  fastify: '>=4.0.0',
  name: 'app-services',
  // dependencies: ['fastify-prisma-client'],
});
