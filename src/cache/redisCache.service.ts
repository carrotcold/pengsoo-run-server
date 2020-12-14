import { Injectable, Inject, CACHE_MANAGER, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisCacheService {
  private readonly logger: Logger = new Logger('RedisCacheService');

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
    this.logger.log('RedisCacheService INIT');
  }

  async get(key: string): Promise<any> {
    const value = await this.cacheManager.get(key);
    return JSON.parse(value);
  }

  async getMany(keys: string[]): Promise<any[]> {
    const value = await this.cacheManager.mget(keys);
    return JSON.parse(value);
  }

  async set(key: string, value: any): Promise<string> {
    return await this.cacheManager.set(key, JSON.stringify(value));
  }

  async delete(key: string): Promise<string> {
    return await this.cacheManager.del(key);
  }

  async keys(): Promise<string[]> {
    return await this.cacheManager.keys();
  }
}
