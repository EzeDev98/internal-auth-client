import { redisClient } from './redisClient.js';

const SESSION_PREFIX = 'bff:session:';

function key(sid) {
  return `${SESSION_PREFIX}${sid}`;
}

export async function saveSession(sid, data, ttlSeconds) {
  await redisClient.set(key(sid), JSON.stringify(data), { EX: ttlSeconds });
}

export async function readSession(sid) {
  const raw = await redisClient.get(key(sid));
  return raw ? JSON.parse(raw) : null;
}

export async function deleteSession(sid) {
  await redisClient.del(key(sid));
}
