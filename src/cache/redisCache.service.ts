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
    this.logger.debug(`[GET] ${key}=> ${value}`);
    return JSON.parse(value);
  }

  async getMany(keys: string[]): Promise<any[]> {
    if (!keys.length) return [];

    const value = await this.cacheManager.mget(keys);
    this.logger.debug(`[GET MANY] ${keys}=> ${value}`);
    return JSON.parse(value);
  }

  async set(key: string, value: any): Promise<any> {
    await this.cacheManager.set(key, JSON.stringify(value));
    this.logger.debug(`[SET] ${key}: ${JSON.stringify(value)}`);
    return value;
  }

  async delete(key: string): Promise<string> {
    const deletedValue = await this.cacheManager.del(key);
    this.logger.debug(`[DELETE] ${key}: ${deletedValue}`);
    return deletedValue;
  }

  async keys(): Promise<string[]> {
    return await this.cacheManager.keys();
  }
}
