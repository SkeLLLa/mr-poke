import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { GitlabService, type IGitlabServiceOptions } from './gitlab/gitlab.service';
import { ReminderService, type IReminderServiceOptions } from './reminder/reminder.service';
import { SlackService, type ISlackServiceOptions } from './slack/slack.service';
import { UsersProvider } from './users/users.provider';
import { UsersService, type IUsersServiceOptions } from './users/users.service';

export interface PluginOptions {
  gitlab: IGitlabServiceOptions;
  slack: ISlackServiceOptions;
  users: IUsersServiceOptions;
  reminder: IReminderServiceOptions;
}

export interface IServices {
  gitlab: GitlabService;
  slack: SlackService;
  users: UsersService;
  reminder: ReminderService;
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
  const { log, prisma } = app;

  // Providers
  const usersProvider = new UsersProvider({ log, prisma });

  // Services
  const gitlabService = new GitlabService({ log, options: options.gitlab });
  const slackService = new SlackService({ log, options: options.slack });
  const usersService = new UsersService({ log, options: options.users, gitlabService, slackService, usersProvider });
  const reminderService = new ReminderService({
    log,
    options: options.reminder,
    gitlabService,
    slackService,
    usersService,
  });

  // Decorate
  app.decorate('services', {
    gitlab: gitlabService,
    slack: slackService,
    users: usersService,
    reminder: reminderService,
  });
};

export default fp(servicesPlugins, {
  fastify: '>=4.0.0',
  name: 'app-services',
  dependencies: ['fastify-prisma'],
});
