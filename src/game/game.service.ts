import { Injectable } from '@nestjs/common';

import { RedisCacheService } from '../redisCache/redisCache.service';
import {
  Game,
  GameMode,
  GameProgress,
  Player,
  PlayerRole,
} from '../types/game.type';

@Injectable()
export class GameService {
  constructor(private readonly redisCacheService: RedisCacheService) {}

  async getAll(): Promise<any[]> {
    const keys = await this.redisCacheService.keys();
    return await this.redisCacheService.getMany(keys);
  }

  async create(id: string, mode: GameMode): Promise<Game> {
    const roleList = this.assignRole(mode);
    const emptyPlayerList = roleList.map(this.createPlayer);

    const newGame: Game = {
      id,
      mode,
      progress: GameProgress.WAITING,
      playerList: emptyPlayerList,
    };

    await this.redisCacheService.set(id, newGame);
    return newGame;
  }

  async join(playerId: string, gameId: string): Promise<Player[]> {
    const game = (await this.redisCacheService.get(gameId)) as Game;

    for (const player of game.playerList) {
      if (!player.id) {
        player.id = playerId;
        await this.redisCacheService.set(gameId, game);
        return game.playerList;
      }
    }

    console.log('full');
    return null;
  }

  private assignRole(mode: GameMode): PlayerRole[] {
    switch (mode) {
      case GameMode.P1:
        return [PlayerRole.ALL];
      case GameMode.P2:
        return [PlayerRole.LR, PlayerRole.J];
      case GameMode.P3:
        return [PlayerRole.L, PlayerRole.R, PlayerRole.J];
    }
  }

  private createPlayer(role: PlayerRole): Player {
    return { id: null, role };
  }
}
