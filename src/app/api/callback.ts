import type { FastifyInstance } from 'fastify';
import { StatusCodes } from 'http-status-codes';
import { DateTime } from 'luxon';

export interface ICallbackPluginOptions {
  callbackRoute: string;
}

export default async function oauth2Callback(app: FastifyInstance, options: ICallbackPluginOptions): Promise<void> {
  const { log, services } = app;

  app.get(
    options.callbackRoute,

    async (request, reply): Promise<{ msg: string }> => {
      try {
        const { token } = await app.gitlabOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
        token;
        const gitlabUser = await services.gitlab.getUserData({ oauthToken: token.access_token });
        log.info(gitlabUser, 'Gitlab user');
        const emailData = gitlabUser.emails[0];
        // .find((v) => v.email.includes('@example.com'));
        if (!emailData) {
          return { msg: 'No email' };
        }
        const { email } = emailData;
        const slackUser = await services.slack.getUserByEmail({ email });
        log.info(slackUser, 'Slack user');
        if (!slackUser) {
          return { msg: 'No slack user' };
        }
        const now = DateTime.now().plus({ minutes: 1 }).toISO();
        await services.slack.sendNotification({ userId: slackUser.id, text: `Reminder: ${now}` });
        reply.status(StatusCodes.CREATED);
        return { msg: 'ok' };
      } catch (err) {
        log.error(err, 'Failed to get test token');
        throw err;
      }
    },
  );
}
