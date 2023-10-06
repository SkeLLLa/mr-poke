import { createError } from '@fastify/error';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { StatusCodes } from 'http-status-codes';

export interface IFastifyPrismaClientOptions {
  gitlab: {
    token: string;
  };
}

declare module 'fastify' {
  interface FastifyInstance {
    verifyGitlabToken: (request: FastifyRequest, reply: FastifyReply) => void;
  }
}

const errorGitlabTokenValidation = createError(
  'GITLAB_TOKEN_VALIDATION_FAILED',
  'Gitlab token validation failed, check your `GL_HOOK_TOKEN` env variable.',
  StatusCodes.FORBIDDEN,
);

const fastifyPrismaPlugin: FastifyPluginAsync<IFastifyPrismaClientOptions> = async (fastify, options) => {
  async function verifyGitlabToken(req: FastifyRequest) {
    const value = req.headers['x-gitlab-token'];
    if (value !== options.gitlab.token) {
      throw errorGitlabTokenValidation();
    }
  }
  fastify.decorate('verifyGitlabToken', verifyGitlabToken);
};

export default fp(fastifyPrismaPlugin, {
  name: 'fastify-gitlab-token-verify',
  fastify: '>=4.x',
});
