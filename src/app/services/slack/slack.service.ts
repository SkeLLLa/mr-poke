import { WebClient } from '@slack/web-api';
import { ILoggableDeps, Loggable } from '../../common/Loggable';

export interface ISlackServiceOptions {
  /**
   * Personal or group access token
   */
  token: string;
  /**
   * Slack api url
   */
  slackApiUrl?: string;
}

export interface ISlackUser {
  id: string;
  username?: string;
  timezone?: string;
}

export class SlackService extends Loggable {
  private readonly slack: WebClient;
  constructor(
    private readonly deps: {
      options: ISlackServiceOptions;
    } & ILoggableDeps,
  ) {
    super(SlackService.name, __filename, deps);
    this.slack = new WebClient(this.deps.options.token, {
      // logger: this.log,
      slackApiUrl: this.deps.options.slackApiUrl,
    });
  }

  async getUserByEmail(args: { email: string }): Promise<ISlackUser | undefined> {
    const { user } = await this.slack.users.lookupByEmail({
      email: args.email,
    });

    if (!user) {
      return;
    }

    return {
      id: user.id!,
      username: user.name,
      timezone: user.tz,
    };
  }

  // async addReminder(args: { userId: string; time: string; text: string }): Promise<void> {
  //   await this.slack.reminders.add({ text: args.text, time: args.time, user: args.userId });
  // }

  async sendNotification(args: { userId: string; text: string }): Promise<void> {
    await this.slack.chat.postMessage({
      channel: args.userId,
      text: args.text,
    });
  }
}
