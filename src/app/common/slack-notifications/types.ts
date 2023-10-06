import type { ChatPostMessageArguments } from '@slack/web-api';

export interface ISlackMessage extends Pick<ChatPostMessageArguments, 'blocks' | 'text' | 'icon_emoji' | 'mrkdwn'> {
  text: string;
}

export type TAction =
  | 'open'
  | 'close'
  | 'reopen'
  | 'update'
  | 'approved'
  | 'unapproved'
  | 'approval'
  | 'unapproval'
  | 'merge';
