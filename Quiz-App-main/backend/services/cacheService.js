import { redisClient } from "../config/redis.js";

// In-memory cache used when Redis is not available (development/local)
const inMemoryCache = new Map();

const isRedisRuntimeEnabled = () => {
  // Only use Redis in production-like environments
  const isProd = process.env.NODE_ENV === "production" || process.env.RENDER;
  // Ensure the redis client is actually open
  const isClientOpen = Boolean(redisClient) && Boolean(redisClient.isOpen);
  return isProd && isClientOpen;
};

const get = async (key) => {
  if (!isRedisRuntimeEnabled()) {
    const data = inMemoryCache.get(key);
    return data ?? null;
  }
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

const set = (key, value, expiration = 3600) => {
  if (!isRedisRuntimeEnabled()) {
    // Store plain value in memory
    inMemoryCache.set(key, value);
    // Basic TTL simulation: schedule deletion
    if (Number.isFinite(expiration) && expiration > 0) {
      setTimeout(() => inMemoryCache.delete(key), Number(expiration) * 1000);
    }
    return Promise.resolve(true);
  }
  return redisClient.set(key, JSON.stringify(value), { EX: expiration.toString() });
};

const del = (key) => {
  if (!isRedisRuntimeEnabled()) {
    inMemoryCache.delete(key);
    return Promise.resolve(1);
  }
  return redisClient.del(key);
};

const clearCache = (key) => {
  return del(key);
};

const flushAll = () => {
  if (!isRedisRuntimeEnabled()) {
    inMemoryCache.clear();
    return Promise.resolve("OK");
  }
  return redisClient.flushDb();
};

const delByPattern = async (pattern) => {
  if (!isRedisRuntimeEnabled()) {
    // Simple pattern match for in-memory keys
    const regex = new RegExp("^" + pattern.replace("*", ".*") + "$");
    for (const key of inMemoryCache.keys()) {
      if (regex.test(key)) inMemoryCache.delete(key);
    }
    return;
  }

  let cursor = "0";
  do {
    const reply = await redisClient.scan(cursor, {
      MATCH: pattern,
      COUNT: "100",
    });
    cursor = reply.cursor;
    if (reply.keys.length > 0) {
      await redisClient.del(reply.keys);
    }
  } while (cursor !== "0");
};

export default {
  get,
  set,
  del,
  clearCache,
  flushAll,
  delByPattern,
};
