import { ILoggableDeps, Loggable } from '../../common/Loggable';
import { AddAsigneesNotification } from '../../common/slack-notifications/AddAssignees';
import { AddReviewersNotification } from '../../common/slack-notifications/AddReviewers';
import { MergeRequestActionNotification } from '../../common/slack-notifications/MergeRequestAction';
import type { TAction } from '../../common/slack-notifications/types';
import type { TMergeRequest } from '../../schemas/MergeRequest.schema';
import { GitlabService } from '../gitlab/gitlab.service';
import { SlackService } from '../slack/slack.service';
import { UsersService } from '../users/users.service';

export interface IReminderServiceOptions {}

interface IRecipient {
  gitlabId: number;
  name: string;
  avatar: string;
}

interface IMr {
  id: number;
  url: string;
  action: TAction;
  title: string;
}

interface IProject {
  id: number;
  name: string;
  url: string;
}

function isValidSlackRecipient(id: string | undefined): id is string {
  return !!id;
}

export class ReminderService extends Loggable {
  constructor(
    private readonly deps: {
      options: IReminderServiceOptions;
      slackService: SlackService;
      gitlabService: GitlabService;
      usersService: UsersService;
    } & ILoggableDeps,
  ) {
    super(ReminderService.name, __filename, deps);
  }

  private async notify(args: {
    recipients: IRecipient[];
    source: IRecipient;
    notifySource?: boolean;
    mergeRequest: IMr;
    project: IProject;
  }): Promise<void> {
    const { recipients, source, notifySource, mergeRequest, project } = args;
    const gitlabUserIds = Array.from(new Set<number>([...recipients.map((v) => v.gitlabId), source.gitlabId]));

    const users = await this.deps.usersService.getUsersByGitlabId({ gitlabUserIds });

    const sourceUser = users.get(source.gitlabId);

    const message = new MergeRequestActionNotification({
      source: {
        avatar: source.avatar,
        name: source.name,
        id: sourceUser?.slackUser?.id,
      },
      mergeRequest,
      project,
    });

    await Promise.all(
      recipients
        .filter((i) => notifySource || i.gitlabId !== source.gitlabId)
        .map((i) => users.get(i.gitlabId)?.slackUser?.id)
        .filter(isValidSlackRecipient)
        .map((i) =>
          this.deps.slackService.sendNotification({ channel: i, ...message }).catch((err) => {
            this.log.error(err, `Failed sending notification to "${i}"`);
          }),
        ),
    );
  }

  private async notifyToAddReviewers(args: {
    source: IRecipient;
    mergeRequest: IMr;
    project: IProject;
  }): Promise<void> {
    const { source, mergeRequest, project } = args;
    const gitlabUserIds = [source.gitlabId];

    const users = await this.deps.usersService.getUsersByGitlabId({ gitlabUserIds });

    const sourceUser = users.get(source.gitlabId);

    const message = new AddReviewersNotification({
      source: {
        avatar: source.avatar,
        name: source.name,
        id: sourceUser?.slackUser?.id,
      },
      mergeRequest,
      project,
    });

    if (!sourceUser?.slackUser?.id) {
      return;
    }
    await this.deps.slackService.sendNotification({ channel: sourceUser.slackUser.id, ...message }).catch((err) => {
      this.log.error(err, `Failed sending notification to "${sourceUser.slackUser?.id}"`);
    });
  }

  private async notifyToAddAssignees(args: {
    source: IRecipient;
    mergeRequest: IMr;
    project: IProject;
  }): Promise<void> {
    const { source, mergeRequest, project } = args;
    const gitlabUserIds = [source.gitlabId];

    const users = await this.deps.usersService.getUsersByGitlabId({ gitlabUserIds });

    const sourceUser = users.get(source.gitlabId);

    const message = new AddAsigneesNotification({
      source: {
        avatar: source.avatar,
        name: source.name,
        id: sourceUser?.slackUser?.id,
      },
      mergeRequest,
      project,
    });

    if (!sourceUser?.slackUser?.id) {
      return;
    }
    await this.deps.slackService.sendNotification({ channel: sourceUser.slackUser.id, ...message }).catch((err) => {
      this.log.error(err, `Failed sending notification to "${sourceUser.slackUser?.id}"`);
    });
  }

  async handleMrEvent(args: { mergeRequest: TMergeRequest }): Promise<void> {
    const { mergeRequest } = args;
    if (
      mergeRequest.object_attributes.draft ||
      !mergeRequest.object_attributes.action ||
      mergeRequest.object_attributes.work_in_progress
    ) {
      // skip draft requests
      // skip unknown actions
      // skip work in progress MRs
      this.log.debug({ mergeRequest }, 'Skipped sending notification');
      return;
    }
    const project: IProject = {
      ...mergeRequest.project,
      url: mergeRequest.project.web_url,
    };
    const mr: IMr = {
      action: mergeRequest.object_attributes.action,
      id: mergeRequest.object_attributes.id,
      title: mergeRequest.object_attributes.title,
      url: mergeRequest.object_attributes.url,
    };
    const source: IRecipient = {
      gitlabId: mergeRequest.user.id,
      avatar: mergeRequest.user.avatar_url,
      name: mergeRequest.user.name ?? mergeRequest.user.username,
    };

    if (mergeRequest.user.id === mergeRequest.object_attributes.author_id) {
      // Author performed action
      switch (mergeRequest.object_attributes.action) {
        case 'open':
        case 'reopen':
        case 'update': {
          if (
            mergeRequest.object_attributes.detailed_merge_status === 'discussions_not_resolved' ||
            mergeRequest.object_attributes.detailed_merge_status === 'mergeable'
          ) {
            this.log.debug({ mergeRequest }, 'Strange MR status');
            return;
          }

          // Notify reviewers
          if (!mergeRequest.reviewers || mergeRequest.reviewers.length === 0) {
            return this.notifyToAddReviewers({
              mergeRequest: mr,
              project,
              source,
            });
          }
          if (!mergeRequest.assignees || mergeRequest.assignees.length === 0) {
            return this.notifyToAddAssignees({
              mergeRequest: mr,
              project,
              source,
            });
          }
          return this.notify({
            mergeRequest: mr,
            project,
            recipients: mergeRequest.reviewers.map((i) => ({
              avatar: i.avatar_url,
              gitlabId: i.id,
              name: i.name ?? i.username,
            })),
            source,
          });
        }
        case 'close':
        case 'merge': {
          //  notify asignees except author
          return this.notify({
            mergeRequest: mr,
            project,
            recipients:
              mergeRequest.assignees?.map((i) => ({
                avatar: i.avatar_url,
                gitlabId: i.id,
                name: i.name ?? i.username,
              })) ?? [],
            source,
          });
        }
        default:
          break;
      }
    }
    // not author performed action
    if (mergeRequest.object_attributes.state === 'merged') {
      // notfiy merge request assignees except source
      return this.notify({
        mergeRequest: mr,
        project,
        recipients:
          mergeRequest.assignees?.map((i) => ({
            avatar: i.avatar_url,
            gitlabId: i.id,
            name: i.name ?? i.username,
          })) ?? [],
        source,
      });
    }
    if (mergeRequest.object_attributes.detailed_merge_status === 'mergeable') {
      // notify assignees that MR could be merged
      return this.notify({
        mergeRequest: mr,
        project,
        recipients:
          mergeRequest.assignees?.map((i) => ({
            avatar: i.avatar_url,
            gitlabId: i.id,
            name: i.name ?? i.username,
          })) ?? [],
        source,
      });
    }

    switch (mergeRequest.object_attributes.action) {
      case 'open':
      case 'reopen':
      case 'update': {
        if (mergeRequest.object_attributes.detailed_merge_status === 'discussions_not_resolved') {
          return;
        }
        // Notify reviewers
        if (!mergeRequest.reviewers) {
          // TODO: Notify author to add reviwers
          return;
        }
        return this.notify({
          mergeRequest: mr,
          project,
          recipients: mergeRequest.reviewers.map((i) => ({
            avatar: i.avatar_url,
            gitlabId: i.id,
            name: i.name ?? i.username,
          })),
          source,
        });
      }
      case 'close':
      case 'merge': {
        //  notify asignees
        return this.notify({
          mergeRequest: mr,
          project,
          recipients:
            mergeRequest.assignees?.map((i) => ({
              avatar: i.avatar_url,
              gitlabId: i.id,
              name: i.name ?? i.username,
            })) ?? [],
          source,
        });
      }
      default:
        break;
    }
  }
}
