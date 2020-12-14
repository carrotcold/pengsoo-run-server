import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { RedisCacheService } from '../cache/redisCache.service';
import { Game } from '../types/game.type';

@Injectable()
export class GameService {
  private readonly logger: Logger = new Logger('GameService');

  constructor(private readonly redisCacheService: RedisCacheService) {
    this.logger.log('GameService INIT');
  }

  async getAll(): Promise<string[]> {
    const keys = await this.redisCacheService.keys();
    return await this.redisCacheService.getMany(keys);
  }

  async handleTest(): Promise<string[]> {
    this.logger.debug('Caching test to Redis');
    return await this.getAll();
  }

  async createNewGame(playerCount: number): Promise<Game> {
    this.logger.debug('Create New Game');
    const newGameId = uuidv4();
    const newGame: Game = {
      id: newGameId,
      playerCount,
      isPlaying: false,
      playerList: [],
    };

    await this.redisCacheService.set(newGameId, JSON.stringify(newGame));
    return newGame;
  }
}
