import type { FastifyInstance } from 'fastify';
import { StatusCodes } from 'http-status-codes';

export interface IK8sReadyProbeOptions {}

export default async function k8sReadyProbe(app: FastifyInstance): Promise<void> {
  app.get('/__ready__', { logLevel: 'silent' }, async (_request, reply): Promise<void> => {
    void reply.status(StatusCodes.OK);
  });
}
