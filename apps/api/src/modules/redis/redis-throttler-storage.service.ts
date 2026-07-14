import { Injectable, Logger } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import type Redis from 'ioredis';

@Injectable()
export class RedisThrottlerStorageService implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorageService.name);

  constructor(private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitKey = `{throttle}:${throttlerName}:${key}`;
    const blockKey = `${hitKey}:block`;

    const multi = this.redis.multi();
    multi.incr(hitKey);
    multi.pttl(hitKey);
    multi.get(blockKey);

    const results = await multi.exec();
    if (!results) {
      this.logger.warn('Redis MULTI returned null; treating as unbound');
      return {
        totalHits: 1,
        timeToExpire: ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }

    const totalHits = Number(results[0]?.[1] ?? 1);
    let timeToExpire = Number(results[1]?.[1] ?? -1);
    const blockTtl = Number(results[2]?.[1] ? await this.redis.pttl(blockKey) : -2);

    if (timeToExpire < 0 && totalHits === 1) {
      await this.redis.pexpire(hitKey, ttl);
      timeToExpire = ttl;
    } else if (timeToExpire < 0) {
      await this.redis.pexpire(hitKey, ttl);
      timeToExpire = ttl;
    }

    let isBlocked = blockTtl > 0;
    let timeToBlockExpire = Math.max(blockTtl, 0);

    if (!isBlocked && totalHits > limit && blockDuration > 0) {
      await this.redis.set(blockKey, '1', 'PX', blockDuration);
      isBlocked = true;
      timeToBlockExpire = blockDuration;
    }

    return {
      totalHits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire,
    };
  }
}
