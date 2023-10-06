import { KnownBlock } from '@slack/web-api';
import { ISlackMessage } from './types';

export class RegisterNotification implements ISlackMessage {
  public readonly blocks: KnownBlock[];
  public readonly text: string;
  public readonly mrkdwn = true;

  constructor(
    readonly options: {
      slackUserId: string;
    },
  ) {
    this.blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `You've successfully connected with Mr. Poke.`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:tada: Congratulations, <@${options.slackUserId}>. From now on you will receive notifications in slack whenever you'll be assigned as reviewer in MRs. Also you get notified when somone reviewed you MR.`,
        },
      },
    ];
    this.text = `:tada: Congratulations. From now on you will receive notifications in slack whenever you'll be assigned as reviewer in MRs. Also you get notified when somone reviewed you MR.`;
  }
}
