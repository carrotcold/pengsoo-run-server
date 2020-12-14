import { Injectable, Inject, CACHE_MANAGER, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisCacheService {
  private readonly logger: Logger = new Logger('RedisCacheService');

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
    this.logger.log('RedisCacheService INIT');
  }

  async get(key: string): Promise<string> {
    console.log('REDIS get', key);
    return await this.cacheManager.get(key);
  }

  async getMany(keys: string[]): Promise<string[]> {
    console.log('REDIS getMany', keys);
    console.log(await this.cacheManager.mget(keys));
    const res = await this.cacheManager.mget(keys);
    console.log('✅   getMany   res', res);
    return await this.cacheManager.mget(keys);
  }

  async set(key: string, value: string): Promise<string> {
    console.log('REDIS set', key, value);
    return await this.cacheManager.set(key, value);
  }

  async delete(key: string): Promise<string> {
    console.log('REDIS delete', key);
    return await this.cacheManager.del(key);
  }

  async keys(): Promise<string[]> {
    console.log('REDIS keys');
    return await this.cacheManager.keys();
  }
}
