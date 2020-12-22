import { Injectable, Inject, CACHE_MANAGER, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisCacheService {
  private readonly logger: Logger = new Logger('RedisCacheService');

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
    this.logger.log('RedisCacheService INIT');
  }

  async getFromGroup(group: string, key: string): Promise<any> {
    const parsedGroup = await this.get(group);
    return parsedGroup && parsedGroup[key];
  }

  async setToGroup(group: string, key: string, value: any): Promise<any> {
    const parsedGroup = await this.get(group);

    if (!parsedGroup) {
      const newGroup = { [key]: value };
      await this.set(group, newGroup);
      return newGroup;
    }

    parsedGroup[key] = value;
    await this.set(group, parsedGroup);
    return parsedGroup;
  }

  async deleteFromGroup(group: string, key: string): Promise<any> {
    const parsedGroup = await this.get(group);

    if (!parsedGroup) return false;

    delete parsedGroup[key];
    await this.set(group, parsedGroup);
    return true;
  }

  private async get(key: string): Promise<any> {
    return JSON.parse(await this.cacheManager.get(key));
  }

  private async set(key: string, value: any): Promise<string> {
    const convertedValue = JSON.stringify(value);
    await this.cacheManager.set(key, convertedValue);
    this.logging('[SET]', key, convertedValue);
    return convertedValue;
  }

  private async delete(key: string): Promise<string> {
    const deletedValue = await this.cacheManager.del(key);
    this.logging('[DEL]', key, deletedValue);
    return deletedValue;
  }

  private logging(method: string, key: string | string[], value: string): void {
    this.logger.debug(`[${method}] ${key} : ${value}`);
  }
}
