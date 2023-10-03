import * as server from '../app/server';
import { logger } from './logger';

// eslint-disable-next-line @typescript-eslint/require-await
void (async () => {
  async function shutdown(): Promise<void> {
    await server.stop();
  }

  function sigHandler(code?: number): void {
    const timeout = new Promise((resolve) => setTimeout(resolve, 2 * 60 * 1000))
    return Promise.race([shutdown(),timeout])
      .then(() => {
        process.exit(code || 0);
      })
      .catch((err) => {
        logger.error(err, 'Failed to stop app');
        process.exit(1);
      }) as unknown as void;
  }

  process.on('SIGTERM', sigHandler);
  process.on('SIGINT', sigHandler);
  try {
    await server.start();
  } catch (err) {
    logger.error(err, 'Failed to start app');
    sigHandler(2);
  }
})();
