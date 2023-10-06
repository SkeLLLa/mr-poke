import createError from '@fastify/error';
import { StatusCodes } from 'http-status-codes';
import { Loggable, type ILoggableDeps } from '../../common/Loggable';
import { GitlabService } from '../gitlab/gitlab.service';
import { SlackService } from '../slack/slack.service';
import type { IFullUser, UsersProvider } from './users.provider';

export interface IUsersServiceOptions {}

const errorSlackUserNotFound = createError('SLACK_USER_NOT_FOUND', 'Slack user not found', StatusCodes.NOT_FOUND);

export class UsersService extends Loggable {
  constructor(
    private readonly deps: {
      options: IUsersServiceOptions;
      usersProvider: UsersProvider;
      slackService: SlackService;
      gitlabService: GitlabService;
    } & ILoggableDeps,
  ) {
    super(UsersService.name, __filename, deps);
  }

  async getUsersByGitlabId(args: { gitlabUserIds: number[] }): Promise<Map<number, IFullUser | undefined>> {
    return this.deps.usersProvider.getUsersByGitlabId(args);
  }

  async createUserIfNotExists(args: { gitlabAccessToken: string }): Promise<IFullUser> {
    const gitlabUser = await this.deps.gitlabService.getUserData({ oauthToken: args.gitlabAccessToken });
    this.log.info(gitlabUser, 'Auth gitlab user');
    const exsistingUsers = await this.deps.usersProvider.getUsersByGitlabId({ gitlabUserIds: [gitlabUser.id] });

    const exsistingUser = exsistingUsers.get(gitlabUser.id);

    // register
    const emails = gitlabUser.emails.map((v) => v.email);
    const slackUser = await this.deps.slackService.getUserByEmails({ emails });

    if (!slackUser) {
      this.log.error({ emails }, 'Failed to find slack user by email');
      throw errorSlackUserNotFound();
    }

    if (exsistingUser) {
      // update
      const updated = await this.deps.usersProvider.updateUser({
        emails,
        timezone: slackUser.timezone,
        timezoneOffset: slackUser.timezoneOffset,
        locale: slackUser.locale,
        id: exsistingUser.id,
      });
      return updated;
    }

    const user = await this.deps.usersProvider.createUser({
      gitlabUserId: gitlabUser.id,
      slackUserId: slackUser.id,
      emails,
      timezone: slackUser.timezone,
      timezoneOffset: slackUser.timezoneOffset,
      locale: slackUser.locale,
    });

    return user;
  }
}
