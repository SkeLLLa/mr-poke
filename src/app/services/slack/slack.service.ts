import { ChatPostMessageArguments, WebClient } from '@slack/web-api';
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
  emailDomains?: string;
}

export interface ISlackUser {
  id: string;
  username?: string;
  timezone?: string;
  timezoneOffset?: number;
  locale?: string;
}

export class SlackService extends Loggable {
  private readonly slack: WebClient;
  private readonly emailDomains: string[];
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
    this.emailDomains = this.deps.options.emailDomains?.split(',') ?? [];
  }

  async getUserByEmails(args: { emails: string[] }): Promise<ISlackUser | undefined> {
    const orgMails = this.emailDomains.length
      ? args.emails.filter((v) => {
          const [, domain] = v.split('@');
          return this.emailDomains.includes(domain);
        })
      : args.emails;
    const users = await Promise.all(
      orgMails.map((email) => {
        return this.getUserByEmail({ email });
      }),
    );

    const user = users.find((v) => !!v);

    if (!user) {
      return;
    }

    return user;
  }

  async getUserByEmail(args: { email: string }): Promise<ISlackUser | undefined> {
    try {
      const { user } = await this.slack.users.lookupByEmail({
        email: args.email,
      });

      if (!user) {
        return;
      }

      const { user: info } = await this.slack.users.info({
        user: user.id!,
        include_locale: true,
      });

      return {
        id: user.id!,
        username: user.name,
        timezone: user.tz,
        timezoneOffset: user.tz_offset,
        locale: info?.locale,
      };
    } catch (err) {
      this.log.error(err, 'Failed to get user');
      return;
    }
  }

  async sendNotification(args: ChatPostMessageArguments): Promise<void> {
    await this.slack.chat.postMessage(args);
  }
}
