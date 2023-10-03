import { Gitlab, MergeRequestSchemaWithBasicLabels } from '@gitbeaker/rest';
import { ILoggableDeps, Loggable } from '../../common/Loggable';

export interface IGitlabServiceOptions {
  /**
   * Personal or group access token
   */
  token: string;
  /**
   * Gitlab host
   */
  host?: string;
}

export interface IGitlabEmail {
  id: number;
  email: string;
}

export interface IGitlabUser {
  id: number;
  username: string;
  localTime?: string;
  emails: IGitlabEmail[];
}

export class GitlabService extends Loggable {
  private readonly gitlab;
  constructor(
    private readonly deps: {
      options: IGitlabServiceOptions;
    } & ILoggableDeps,
  ) {
    super(GitlabService.name, __filename, deps);
    this.gitlab = new Gitlab({ token: this.deps.options.token, host: this.deps.options.host });
  }

  async getUserData(args: { oauthToken: string }): Promise<IGitlabUser> {
    //
    const gitlab = new Gitlab({
      oauthToken: args.oauthToken,
      host: this.deps.options.host,
    });

    const [me, emails] = await Promise.all([gitlab.Users.showCurrentUser(), gitlab.UserEmails.all()]);

    return {
      id: me.id,
      username: me.username,
      localTime: me.local_time,
      emails: emails.map((v) => ({ id: v.id, email: v.email })),
    };
  }

  async getMergeRequests(): Promise<MergeRequestSchemaWithBasicLabels[]> {
    const mrs = await this.gitlab.MergeRequests.all({});
    return mrs;
  }
}
