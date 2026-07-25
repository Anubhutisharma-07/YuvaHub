import Redis from "ioredis";
import rateLimit, { MemoryStore } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import dotenv from "dotenv";

dotenv.config();

declare global {
  var REDIS_AVAILABLE: boolean;
}
global.REDIS_AVAILABLE = false;

export const DEFAULT_CACHE_TTL = 300;

export async function cacheSet(
  key: string,
  value: unknown,
  ttl: number = DEFAULT_CACHE_TTL,
): Promise<boolean> {
  if (!redisClient || redisClient.status !== "ready") {
    return false;
  }

  const safeTtl = Math.max(1, Math.trunc(ttl) || DEFAULT_CACHE_TTL);
  await redisClient.set(key, JSON.stringify(value), "EX", safeTtl);
  return true;
}

export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  if (!redisClient || redisClient.status !== "ready") {
    return null;
  }

  const cached = await redisClient.get(key);
  if (cached === null) return null;

  try {
    return JSON.parse(cached) as T;
  } catch {
    await redisClient.del(key);
    return null;
  }
}

export async function getOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  ttl: number = DEFAULT_CACHE_TTL,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const value = await factory();

  try {
    await cacheSet(key, value, ttl);
  } catch (error) {
    console.error(`[Cache] Unable to cache key ${key}:`, error);
  }

  return value;
}

export let redisClient: Redis;

try {
  redisClient = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: false,
    family: 4,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return 200;
    }
  });

  let redisErrorLogged = false;
  redisClient.on('error', (err) => {
    if (!redisErrorLogged) {
      console.warn('[Redis] Connection failed or Redis is not running. Bypassing rate limiting (fail-open mode).');
      redisErrorLogged = true;
    }
    global.REDIS_AVAILABLE = false;

export const DEFAULT_CACHE_TTL = 300;

export async function cacheSet(
  key: string,
  value: unknown,
  ttl: number = DEFAULT_CACHE_TTL,
): Promise<boolean> {
  if (!redisClient || redisClient.status !== "ready") {
    return false;
  }

  const safeTtl = Math.max(1, Math.trunc(ttl) || DEFAULT_CACHE_TTL);
  await redisClient.set(key, JSON.stringify(value), "EX", safeTtl);
  return true;
}

export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  if (!redisClient || redisClient.status !== "ready") {
    return null;
  }

  const cached = await redisClient.get(key);
  if (cached === null) return null;

  try {
    return JSON.parse(cached) as T;
  } catch {
    await redisClient.del(key);
    return null;
  }
}

export async function getOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  ttl: number = DEFAULT_CACHE_TTL,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const value = await factory();

  try {
    await cacheSet(key, value, ttl);
  } catch (error) {
    console.error(`[Cache] Unable to cache key ${key}:`, error);
  }

  return value;
}
  });
  redisClient.on('connect', () => {
    console.log('[Redis] Connected successfully');
    redisErrorLogged = false;
    global.REDIS_AVAILABLE = true;
  });
  redisClient.on('end', () => {
    global.REDIS_AVAILABLE = false;

export const DEFAULT_CACHE_TTL = 300;

export async function cacheSet(
  key: string,
  value: unknown,
  ttl: number = DEFAULT_CACHE_TTL,
): Promise<boolean> {
  if (!redisClient || redisClient.status !== "ready") {
    return false;
  }

  const safeTtl = Math.max(1, Math.trunc(ttl) || DEFAULT_CACHE_TTL);
  await redisClient.set(key, JSON.stringify(value), "EX", safeTtl);
  return true;
}

export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  if (!redisClient || redisClient.status !== "ready") {
    return null;
  }

  const cached = await redisClient.get(key);
  if (cached === null) return null;

  try {
    return JSON.parse(cached) as T;
  } catch {
    await redisClient.del(key);
    return null;
  }
}

export async function getOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  ttl: number = DEFAULT_CACHE_TTL,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const value = await factory();

  try {
    await cacheSet(key, value, ttl);
  } catch (error) {
    console.error(`[Cache] Unable to cache key ${key}:`, error);
  }

  return value;
}
  });
} catch (e: any) {
  console.error('[Redis] Init error:', e.message);
  global.REDIS_AVAILABLE = false;

export const DEFAULT_CACHE_TTL = 300;

export async function cacheSet(
  key: string,
  value: unknown,
  ttl: number = DEFAULT_CACHE_TTL,
): Promise<boolean> {
  if (!redisClient || redisClient.status !== "ready") {
    return false;
  }

  const safeTtl = Math.max(1, Math.trunc(ttl) || DEFAULT_CACHE_TTL);
  await redisClient.set(key, JSON.stringify(value), "EX", safeTtl);
  return true;
}

export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  if (!redisClient || redisClient.status !== "ready") {
    return null;
  }

  const cached = await redisClient.get(key);
  if (cached === null) return null;

  try {
    return JSON.parse(cached) as T;
  } catch {
    await redisClient.del(key);
    return null;
  }
}

export async function getOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  ttl: number = DEFAULT_CACHE_TTL,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const value = await factory();

  try {
    await cacheSet(key, value, ttl);
  } catch (error) {
    console.error(`[Cache] Unable to cache key ${key}:`, error);
  }

  return value;
}
}

export const createFailOpenStore = (prefix: string) => {
  const fallbackStore = new MemoryStore();
  let store: any;
  if (redisClient) {
    store = new RedisStore({
      sendCommand: (...args: string[]) => {
        const [command, ...commandArgs] = args;
        return redisClient.call(command, ...commandArgs) as Promise<any>;
      },
      prefix: prefix,
    });
  }

  return {
    ...fallbackStore,
    increment: async (key: string) => {
      if (global.REDIS_AVAILABLE && store) {
        try {
          return await store.increment(key);
        } catch (err: any) {
          console.error(`[RateLimit] Redis error. Failing open for key: ${key}`);
          global.REDIS_AVAILABLE = false;

export const DEFAULT_CACHE_TTL = 300;

export async function cacheSet(
  key: string,
  value: unknown,
  ttl: number = DEFAULT_CACHE_TTL,
): Promise<boolean> {
  if (!redisClient || redisClient.status !== "ready") {
    return false;
  }

  const safeTtl = Math.max(1, Math.trunc(ttl) || DEFAULT_CACHE_TTL);
  await redisClient.set(key, JSON.stringify(value), "EX", safeTtl);
  return true;
}

export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  if (!redisClient || redisClient.status !== "ready") {
    return null;
  }

  const cached = await redisClient.get(key);
  if (cached === null) return null;

  try {
    return JSON.parse(cached) as T;
  } catch {
    await redisClient.del(key);
    return null;
  }
}

export async function getOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  ttl: number = DEFAULT_CACHE_TTL,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const value = await factory();

  try {
    await cacheSet(key, value, ttl);
  } catch (error) {
    console.error(`[Cache] Unable to cache key ${key}:`, error);
  }

  return value;
}
        }
      }
      return fallbackStore.increment(key);
    },
    decrement: async (key: string) => {
      if (global.REDIS_AVAILABLE && store) {
        try { return await store.decrement(key); } catch (e) { global.REDIS_AVAILABLE = false;

export const DEFAULT_CACHE_TTL = 300;

export async function cacheSet(
  key: string,
  value: unknown,
  ttl: number = DEFAULT_CACHE_TTL,
): Promise<boolean> {
  if (!redisClient || redisClient.status !== "ready") {
    return false;
  }

  const safeTtl = Math.max(1, Math.trunc(ttl) || DEFAULT_CACHE_TTL);
  await redisClient.set(key, JSON.stringify(value), "EX", safeTtl);
  return true;
}

export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  if (!redisClient || redisClient.status !== "ready") {
    return null;
  }

  const cached = await redisClient.get(key);
  if (cached === null) return null;

  try {
    return JSON.parse(cached) as T;
  } catch {
    await redisClient.del(key);
    return null;
  }
}

export async function getOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  ttl: number = DEFAULT_CACHE_TTL,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const value = await factory();

  try {
    await cacheSet(key, value, ttl);
  } catch (error) {
    console.error(`[Cache] Unable to cache key ${key}:`, error);
  }

  return value;
} }
      }
      if (fallbackStore.decrement) {
        return fallbackStore.decrement(key);
      }
    },
    resetKey: async (key: string) => {
      if (global.REDIS_AVAILABLE && store) {
        try { return await store.resetKey(key); } catch (e) { global.REDIS_AVAILABLE = false;

export const DEFAULT_CACHE_TTL = 300;

export async function cacheSet(
  key: string,
  value: unknown,
  ttl: number = DEFAULT_CACHE_TTL,
): Promise<boolean> {
  if (!redisClient || redisClient.status !== "ready") {
    return false;
  }

  const safeTtl = Math.max(1, Math.trunc(ttl) || DEFAULT_CACHE_TTL);
  await redisClient.set(key, JSON.stringify(value), "EX", safeTtl);
  return true;
}

export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  if (!redisClient || redisClient.status !== "ready") {
    return null;
  }

  const cached = await redisClient.get(key);
  if (cached === null) return null;

  try {
    return JSON.parse(cached) as T;
  } catch {
    await redisClient.del(key);
    return null;
  }
}

export async function getOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  ttl: number = DEFAULT_CACHE_TTL,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const value = await factory();

  try {
    await cacheSet(key, value, ttl);
  } catch (error) {
    console.error(`[Cache] Unable to cache key ${key}:`, error);
  }

  return value;
} }
      }
      if (fallbackStore.resetKey) {
        return fallbackStore.resetKey(key);
      }
    },
  };
};

