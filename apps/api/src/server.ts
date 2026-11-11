import { buildApp } from './app.js';
import { config } from './config.js';

const app = await buildApp();

try {
  await app.listen({ port: config.port, host: process.env.HOST ?? '127.0.0.1' });
  app.log.info(`Talea API listening on http://127.0.0.1:${config.port} (${config.nodeEnv})`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    app.log.info(`${signal} received, closing`);
    await app.close();
    process.exit(0);
  });
}
