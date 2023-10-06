import { Type, TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyInstance } from 'fastify';
import { StatusCodes } from 'http-status-codes';
import { MergeRequestSchema } from '../../schemas/MergeRequest.schema';

// import { DateTime } from 'luxon';

export interface ICallbackPluginOptions {
  gitlabHookRoute: string;
  gitlabHookToken: string;
}

const HookSchema = {
  headers: Type.Object({
    'x-gitlab-event': Type.String(),
    'x-gitlab-event-uuid': Type.String(),
    'x-gitlab-instance': Type.String(),
    'x-gitlab-token': Type.String(),
    'x-gitlab-webhook-uuid': Type.String(),
  }),
  body: MergeRequestSchema,
};

export default async function gitlabHook(app: FastifyInstance, options: ICallbackPluginOptions): Promise<void> {
  const { log } = app;

  app.withTypeProvider<TypeBoxTypeProvider>().post(
    options.gitlabHookRoute,
    {
      schema: HookSchema,
      preHandler: (req, res, done) => {
        const handler = app.auth([app.verifyGitlabToken], {
          relation: 'and',
        });
        handler.call(app, req, res, done);
      },
    },
    async (request, reply): Promise<void> => {
      try {
        log.debug(request.body, 'Merge request event');
        try {
          await app.services.reminder.handleMrEvent({ mergeRequest: request.body });
        } catch (err) {
          log.error(err, 'Failed to handle merge request event');
        }
        void reply.status(StatusCodes.OK);
      } catch (err) {
        log.error(err, 'Failed handle hook');
        throw err;
      }
    },
  );
}
