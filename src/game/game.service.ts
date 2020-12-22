import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { Game, GameMode, GameProgress, Player, PlayerRole } from './game.type';
import { MESSAGE, GROUP } from './game.constant';
import { RedisCacheService } from '../redisCache/redisCache.service';

interface ServiceResponse {
  error: null | string;
  payload: any;
}

@Injectable()
export class GameService {
  constructor(private readonly redisCacheService: RedisCacheService) {}

  async create(hostId: string, mode: GameMode): Promise<ServiceResponse> {
    const newGameId = uuidv4();
    const roleList = this.assignRole(mode);

    const newGame: Game = {
      id: newGameId,
      hostId: hostId,
      mode,
      progress: GameProgress.WAITING,
      playerList: roleList.map(this.createPlayer),
      error: null,
    };

    try {
      await this.redisCacheService.setToGroup(GROUP.GAME, newGameId, newGame);
      await this.redisCacheService.setToGroup(GROUP.HOST_GAME, hostId, newGameId);
      return this.response(null, newGame);
    } catch (error) {
      return this.response(error, null);
    }
  }

  async join(playerId: string, gameId: string): Promise<ServiceResponse> {
    try {
      const game = await this.getGame(gameId);

      if (!game) return this.response(MESSAGE.NOT_EXIST, null);

      const vacancy = game.playerList.find(player => !player.id);

      if (!vacancy) return this.response(MESSAGE.FULL, null);

      vacancy.id = playerId;
      await this.redisCacheService.setToGroup(GROUP.GAME, gameId, game);
      await this.redisCacheService.setToGroup(GROUP.PLAYER_GAME, playerId, gameId);
      return this.response(null, game.playerList);
    } catch (error) {
      return this.response(error, null);
    }
  }

  async start(gameId: string): Promise<ServiceResponse> {
    try {
      const game = await this.getGame(gameId);

      if (!game) return this.response(MESSAGE.NOT_EXIST, null);

      game.progress = GameProgress.PLAYING;

      await this.redisCacheService.setToGroup(GROUP.GAME, gameId, game);
      return this.response(null, game.progress);
    } catch (error) {
      return this.response(error, null);
    }
  }

  async leave(playerId: string, gameId: string): Promise<ServiceResponse> {
    try {
      const game = await this.getGame(gameId);

      if (!game) return this.response(MESSAGE.NOT_EXIST, null);

      const leavedPlayer = game.playerList.find(player => player.id === playerId);

      leavedPlayer.id = null;
      await this.redisCacheService.setToGroup(GROUP.GAME, gameId, game);
      await this.redisCacheService.deleteFromGroup(GROUP.PLAYER_GAME, playerId);
      return this.response(null, game.playerList);
    } catch (error) {
      return this.response(error, null);
    }
  }

  async destroy(gameId: string): Promise<ServiceResponse> {
    try {
      const game = await this.getGame(gameId);

      if (!game) return this.response(MESSAGE.NOT_EXIST, null);

      for (const playerId of game.playerList.map(player => player.id)) {
        await this.redisCacheService.deleteFromGroup(GROUP.PLAYER_GAME, playerId);
      }

      await this.redisCacheService.deleteFromGroup(GROUP.GAME, gameId);
      await this.redisCacheService.deleteFromGroup(GROUP.HOST_GAME, game.hostId);

      return this.response(null, MESSAGE.DESTROYED);
    } catch (error) {
      return this.response(error, null);
    }
  }

  async getGameIdByHostId(hostId: string): Promise<string> {
    return await this.redisCacheService.getFromGroup(GROUP.HOST_GAME, hostId);
  }

  async getGameIdByPlayerId(playerId: string): Promise<string> {
    return await this.redisCacheService.getFromGroup(GROUP.PLAYER_GAME, playerId);
  }

  private async getGame(gameId: string): Promise<Game> {
    return await this.redisCacheService.getFromGroup(GROUP.GAME, gameId);
  }

  private createPlayer(role: PlayerRole): Player {
    return { id: null, role };
  }

  private response(error: null | string, payload: any): ServiceResponse {
    return { error, payload };
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
}
