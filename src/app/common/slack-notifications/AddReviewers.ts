import { KnownBlock } from '@slack/web-api';
import { ISlackMessage, TAction } from './types';

export class AddReviewersNotification implements ISlackMessage {
  public readonly blocks: KnownBlock[];
  public readonly text: string;

  constructor(
    readonly options: {
      project: {
        name: string;
        url: string;
      };
      source: {
        id?: string;
        name: string;
        avatar: string;
      };
      mergeRequest: {
        id: number;
        title: string;
        url: string;
        action: TAction;
      };
    },
  ) {
    this.text = `Merge request ${options.mergeRequest.title} in <${options.project.url}|${options.project.name}> has no reviewers. If you expect your MR to be reviewed, please add them.`;
    this.blocks = [
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Project: <${options.project.url}|${options.project.name}>`,
          },
          {
            type: 'mrkdwn',
            text: `MR: <${options.mergeRequest.url}|${options.mergeRequest.title}>`,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'image',
            image_url: `${options.source.avatar}`,
            alt_text: 'source_avatar',
          },
          {
            type: 'mrkdwn',
            text: `Merge request has no reviewers. If you expect your MR to be reviewed, please add them.`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: ':eyes: Review',
              emoji: true,
            },
            url: options.mergeRequest.url,
            style: 'primary',
            value: options.mergeRequest.id.toString(),
            action_id: 'mr-open',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: ':link: Project',
              emoji: true,
            },
            url: options.project.url,
            value: options.project.name,
          },
        ],
      },
    ];
  }
}
