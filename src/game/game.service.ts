import { Injectable } from '@nestjs/common';
import { exception } from 'console';

import { RedisCacheService } from '../redisCache/redisCache.service';
import {
  Game,
  GameMode,
  GameProgress,
  Player,
  PlayerRole,
} from '../types/game.type';

interface ServiceResponse {
  error: null | string;
  payload: any;
}

@Injectable()
export class GameService {
  constructor(private readonly redisCacheService: RedisCacheService) {}

  async create(id: string, mode: GameMode): Promise<ServiceResponse> {
    const roleList = this.assignRole(mode);
    const emptyPlayerList = roleList.map(this.createPlayer);

    const newGame: Game = {
      id,
      mode,
      progress: GameProgress.WAITING,
      playerList: emptyPlayerList,
      error: null,
    };

    try {
      await this.redisCacheService.set(id, newGame);
      return this.response(null, newGame);
    } catch (error) {
      return this.response(error, null);
    }
  }

  async destroy(gameId: string): Promise<ServiceResponse> {
    try {
      const game = (await this.redisCacheService.get(gameId)) as Game;

      for (const playerId of game.playerList.map(player => player.id)) {
        await this.redisCacheService.delete(playerId);
      }

      await this.redisCacheService.delete(gameId);

      return this.response(null, true);
    } catch (error) {
      return this.response(error, null);
    }
  }

  async join(playerId: string, gameId: string): Promise<ServiceResponse> {
    try {
      const game = (await this.redisCacheService.get(gameId)) as Game;

      if (!game) return this.response('Game does not exist', null);

      const vacancy = game.playerList.find(player => !player.id);

      if (!vacancy) return this.response('Game is full', null);

      vacancy.id = playerId;
      await this.redisCacheService.set(gameId, game);
      await this.redisCacheService.set(playerId, gameId);
      return this.response(null, game.playerList);
    } catch (error) {
      return this.response(error, null);
    }
  }

  async leave(playerId: string, gameId: string): Promise<ServiceResponse> {
    try {
      const game = (await this.redisCacheService.get(gameId)) as Game;

      if (!game) return this.response('Game does not exist', null);

      const leavedPlayer = game.playerList.find(
        player => player.id === playerId,
      );

      leavedPlayer.id = null;
      await this.redisCacheService.set(gameId, game);
      await this.redisCacheService.delete(playerId);
      return this.response(null, game.playerList);
    } catch (error) {
      return this.response(error, null);
    }
  }

  async getGameIdByPlayerId(playerId: string): Promise<string> {
    return await this.redisCacheService.get(playerId);
  }

  async disconnected(playerId: string): Promise<ServiceResponse> {
    const gameId = await this.getGameIdByPlayerId(playerId);

    if (!gameId) return;

    console.log('✅   disconnected   playerId, gameId', playerId, gameId);
    return await this.leave(playerId, gameId);
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

  private response(error: null | string, payload: any): ServiceResponse {
    return { error, payload };
  }
}
