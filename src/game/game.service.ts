import { Injectable } from '@nestjs/common';

import { Game, GameMode, GameProgress, Player, PlayerRole } from './game.type';
import { MESSAGE } from './game.constant';
import { RedisCacheService } from '../redisCache/redisCache.service';

interface ServiceResponse {
  error: null | string;
  payload: any;
}

@Injectable()
export class GameService {
  constructor(private readonly redisCacheService: RedisCacheService) {}

  public async create(id: string, mode: GameMode): Promise<ServiceResponse> {
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

  public async destroy(gameId: string): Promise<ServiceResponse> {
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

  public async start(gameId: string): Promise<ServiceResponse> {
    try {
      const game = (await this.redisCacheService.get(gameId)) as Game;

      if (!game) return this.response(MESSAGE.NOT_EXIST, null);

      game.progress = GameProgress.PLAYING;

      await this.redisCacheService.set(gameId, game);
      return this.response(null, game.progress);
    } catch (error) {
      return this.response(error, null);
    }
  }

  public async join(playerId: string, gameId: string): Promise<ServiceResponse> {
    try {
      const game = (await this.redisCacheService.get(gameId)) as Game;

      if (!game) return this.response(MESSAGE.NOT_EXIST, null);

      const vacancy = game.playerList.find(player => !player.id);

      if (!vacancy) return this.response(MESSAGE.FULL, null);

      vacancy.id = playerId;
      await this.redisCacheService.set(gameId, game);
      await this.registerPlayer(playerId, gameId);
      return this.response(null, game.playerList);
    } catch (error) {
      return this.response(error, null);
    }
  }

  public async leave(playerId: string, gameId: string): Promise<ServiceResponse> {
    try {
      const game = (await this.redisCacheService.get(gameId)) as Game;

      if (!game) return this.response(MESSAGE.NOT_EXIST, null);

      const leavedPlayer = game.playerList.find(player => player.id === playerId);

      leavedPlayer.id = null;
      await this.redisCacheService.set(gameId, game);
      await this.deletePlayer(playerId);
      return this.response(null, game.playerList);
    } catch (error) {
      return this.response(error, null);
    }
  }

  public async disconnected(id: string): Promise<ServiceResponse> {
    try {
      const game = (await this.redisCacheService.get(id)) as Game;

      if (game) {
        await this.redisCacheService.delete(id);
        for (const player of game.playerList) {
          if (player.id) {
            await this.deletePlayer(player.id);
          }
        }
        return this.response(MESSAGE.DESTROYED, game.id);
      }

      const players = await this.redisCacheService.get('players');

      if (!players[id]) return this.response(null, null);

      await this.deletePlayer(id);

      return this.response(null, players[id]);
    } catch (error) {
      return this.response(error, null);
    }
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

  private response(error: null | string, payload: any): ServiceResponse {
    return { error, payload };
  }

  private createPlayer(role: PlayerRole): Player {
    return { id: null, role };
  }

  public async getGameIdByPlayerId(playerId: string): Promise<string> {
    const players = await this.redisCacheService.get('players');
    return players[playerId];
  }

  private async registerPlayer(playerId: string, gameId: string): Promise<any> {
    const players = await this.redisCacheService.get('players');

    if (!players) {
      const newPlayers = { [playerId]: gameId };
      await this.redisCacheService.set('players', newPlayers);
      return newPlayers;
    }

    players[playerId] = gameId;
    await this.redisCacheService.set('players', players);
    return players;
  }

  private async deletePlayer(playerId: string): Promise<boolean> {
    const players = await this.redisCacheService.get('players');

    if (!players) return false;

    delete players[playerId];
    await this.redisCacheService.set('players', players);
    return true;
  }
}
