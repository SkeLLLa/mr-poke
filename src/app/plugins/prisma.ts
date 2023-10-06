import { PrismaClient, type Prisma } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

export interface IFastifyPrismaClientOptions {
  prisma: {
    url: string;
    pgbouncer: boolean;
    sslmode: string;
  };
}

declare module 'fastify' {
  interface FastifyRequest {
    prisma: PrismaClient;
  }
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export type TPrismaLogEvents = 'query' | 'error' | 'info' | 'warn';

const fastifyPrismaPlugin: FastifyPluginAsync<IFastifyPrismaClientOptions> = async (fastify, options) => {
  if (fastify.prisma) {
    throw new Error('fastify-prisma already initialized');
  }
  const { url, ...pgParams } = options.prisma;
  const params = new URLSearchParams({
    pgbouncer: pgParams.pgbouncer.toString(),
    sslmode: pgParams.sslmode,
  });
  const prismaOptions: Prisma.PrismaClientOptions = {
    datasources: {
      db: {
        url: `${url}?${params.toString()}`,
      },
    },
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  };
  const prisma = new PrismaClient<typeof prismaOptions, TPrismaLogEvents>(prismaOptions);

  prisma.$on('query', (e: Prisma.QueryEvent) => {
    fastify.log.debug(e, 'Prisma query');
  });
  prisma.$on('info', (e: Prisma.LogEvent) => {
    fastify.log.info(e, 'Prisma info');
  });
  prisma.$on('warn', (e: Prisma.LogEvent) => {
    fastify.log.warn(e, 'Prisma warn');
  });
  prisma.$on('error', (e: Prisma.LogEvent) => {
    fastify.log.error(e, 'Prisma error');
  });

  await prisma.$connect();

  fastify
    .decorate('prisma', prisma)
    .decorateRequest('prisma', { getter: () => fastify.prisma })
    .addHook('onClose', async (fastify) => {
      await fastify.prisma.$disconnect();
    });
};

export default fp(fastifyPrismaPlugin, {
  name: 'fastify-prisma',
  fastify: '>=4.x',
});
