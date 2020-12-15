import { Injectable, Inject, CACHE_MANAGER, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisCacheService {
  private readonly logger: Logger = new Logger('RedisCacheService');

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
    this.logger.log('RedisCacheService INIT');
  }

  async get(key: string): Promise<any> {
    return JSON.parse(await this.cacheManager.get(key));
  }

  async getMany(keys: string[]): Promise<any[]> {
    if (!keys.length) return [];

    return JSON.parse(await this.cacheManager.mget(keys));
  }

  async keys(): Promise<string[]> {
    return await this.cacheManager.keys();
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async set(key: string, value: any): Promise<string> {
    const convertedValue = JSON.stringify(value);
    await this.cacheManager.set(key, convertedValue);
    this.logging('[SET]', key, convertedValue);
    return convertedValue;
  }

  async delete(key: string): Promise<string> {
    const deletedValue = await this.cacheManager.del(key);
    this.logging('[DEL]', key, deletedValue);
    return deletedValue;
  }

  private logging(method: string, key: string | string[], value: string): void {
    this.logger.debug(`[${method}] ${key} : ${value}`);
  }
}
