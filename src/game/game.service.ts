import { Injectable } from '@nestjs/common';

import { RedisCacheService } from '../cache/redisCache.service';
import { Game, GameMode, GameRole } from '../types/game.type';

@Injectable()
export class GameService {
  constructor(private readonly redisCacheService: RedisCacheService) {}

  async create(id: string, mode: GameMode): Promise<Game> {
    return await this.redisCacheService.set(id, {
      id,
      mode,
      playerList: [],
      remainingRole: this.assignRole(mode),
    });
  }

  async join(playerId: string, gameId: string): Promise<Game> {
    const game = (await this.redisCacheService.get(gameId)) as Game;
    // if (!game) return game;
    // const newPlayer: Player = {
    //   id: playerId,
    //   role: game.remainingRole.pop(),
    // };
    return game;
  }

  async getAll(): Promise<any[]> {
    const keys = await this.redisCacheService.keys();
    return await this.redisCacheService.getMany(keys);
  }

  private assignRole(mode: GameMode): GameRole[] {
    switch (mode) {
      case GameMode.P1:
        return [GameRole.ALL];
      case GameMode.P2:
        return [GameRole.J, GameRole.LR];
      case GameMode.P3:
        return [GameRole.J, GameRole.R, GameRole.L];
    }
  }
}
