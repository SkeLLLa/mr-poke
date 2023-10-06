import type { FastifyInstance } from 'fastify';
import { StatusCodes } from 'http-status-codes';
import { RegisterNotification } from '../../common/slack-notifications/Register';

// import { DateTime } from 'luxon';

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

        app.log.debug('Gitlab oauth2 callback');

        const user = await app.services.users.createUserIfNotExists({ gitlabAccessToken: token.access_token });

        app.log.debug({ user }, 'Gitlab got user');

        if (user.slackUser?.id) {
          const registerNotification = new RegisterNotification({ slackUserId: user.slackUser?.id });

          await services.slack.sendNotification({ channel: user.slackUser?.id, ...registerNotification });
        }
        void reply.status(StatusCodes.CREATED);
        return { msg: 'Registration successfull. Check your slack.' };
      } catch (err) {
        log.error(err, 'Failed to get test token');
        throw err;
      }
    },
  );
}
