// Shared Redis connection for the BFF.
import { createClient } from 'redis';
import { env } from '../config/env.js';

export const redisClient = createClient({ url: env.redisUrl });

redisClient.on('error', (err) => {
  console.error('[redis] client error', err);
});

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}
