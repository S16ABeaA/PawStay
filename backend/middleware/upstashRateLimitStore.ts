import { Redis } from "@upstash/redis";
import type { Store, IncrementResponse } from "express-rate-limit";

class UpstashRateLimitStore implements Store {
  localKeys = false;
  prefix: string;

  private readonly redis: Redis;
  private readonly windowMs: number;

  constructor({ redis, windowMs, prefix }: { redis: Redis; windowMs: number; prefix?: string }) {
    this.redis = redis;
    this.windowMs = windowMs;
    this.prefix = prefix || "rl";
  }

  private formatKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  async increment(key: string): Promise<IncrementResponse> {
    const redisKey = this.formatKey(key);

    const totalHits = Number(await this.redis.incr(redisKey));

    if (totalHits === 1) {
      await this.redis.pexpire(redisKey, this.windowMs);
    }

    let ttlMs = Number(await this.redis.pttl(redisKey));
    if (!Number.isFinite(ttlMs) || ttlMs < 0) {
      ttlMs = this.windowMs;
    }

    return {
      totalHits,
      resetTime: new Date(Date.now() + ttlMs),
    };
  }

  async decrement(key: string): Promise<void> {
    const redisKey = this.formatKey(key);
    await this.redis.decr(redisKey);
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = this.formatKey(key);
    await this.redis.del(redisKey);
  }
}

let cachedRedis: Redis | null = null;

const getUpstashRedis = (): Redis | null => {
  if (cachedRedis) return cachedRedis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  cachedRedis = new Redis({
    url,
    token,
  });

  return cachedRedis;
};

export const createUpstashRateLimitStore = ({
  windowMs,
  prefix,
}: {
  windowMs: number;
  prefix: string;
}): Store | undefined => {
  const redis = getUpstashRedis();
  if (!redis) return undefined;

  return new UpstashRateLimitStore({ redis, windowMs, prefix });
};
