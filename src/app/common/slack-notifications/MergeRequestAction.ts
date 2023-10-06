import { KnownBlock } from '@slack/web-api';
import { ISlackMessage, TAction } from './types';

export class MergeRequestActionNotification implements ISlackMessage {
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
    const actionText = this.getActionText(options.mergeRequest.action);
    this.text = `Merge request ${options.mergeRequest.title} in <${options.project.url}|${options.project.name}> was ${actionText}.`;
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
            text: options.source.id
              ? `<@${options.source.id}> ${actionText} merge request.`
              : `${options.source.name} ${actionText} merge request.`,
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

  private getActionText(action: TAction): string {
    switch (action) {
      case 'approved':
        return action;
      case 'approval':
        return 'approved';
      case 'close':
        return 'closed';
      case 'open':
        return 'opened';
      case 'merge':
        return 'merged';
      case 'reopen':
        return 'reopened';
      case 'unapproval':
        return 'unapproved';
      case 'unapproved':
        return action;
      case 'update':
        return 'updated';
    }
  }
}
