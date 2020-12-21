import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';

import { GameService } from './game.service';
import { GameMode, GameProgress } from './game.type';
import { EVENT } from './game.constant';

@WebSocketGateway()
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger: Logger = new Logger('GameGateway');

  @WebSocketServer()
  public server: Server;

  constructor(private readonly gameService: GameService) {}

  @SubscribeMessage(EVENT.CREATE_GAME)
  async handleCreateGame(client: Socket, mode: GameMode): Promise<void> {
    const { error, payload } = await this.gameService.create(client.id, mode);

    if (error) {
      client.emit(EVENT.MESSAGE, error);
      return;
    }

    client.join(payload.id);
    client.emit(EVENT.CREATE_GAME, payload);
  }

  @SubscribeMessage(EVENT.START_GAME)
  async handleStartGame(client: Socket, gameId: string): Promise<void> {
    const { error, payload } = await this.gameService.start(gameId);

    if (error) {
      client.emit(EVENT.MESSAGE, error);
      return;
    }

    this.server.to(gameId).emit(EVENT.UPDATE_GAME_PROGRESS, payload);
  }

  @SubscribeMessage(EVENT.JOIN_GAME)
  async handleJoinGame(client: Socket, gameId: string): Promise<void> {
    const { error, payload } = await this.gameService.join(client.id, gameId);

    if (error) {
      client.emit(EVENT.MESSAGE, error);
      return;
    }

    const newPlayer = payload.find(player => player.id === client.id);

    this.server.to(gameId).emit(EVENT.UPDATE_PLAYERLIST, payload);
    client.emit(EVENT.JOIN_GAME, newPlayer);
  }

  @SubscribeMessage(EVENT.LEAVE_GAME)
  async handleLeaveGame(client: Socket, gameId: string): Promise<void> {
    const { error, payload } = await this.gameService.leave(client.id, gameId);

    if (error) {
      client.emit(EVENT.MESSAGE, error);
      return;
    }

    client.leave(gameId);
    client.emit(EVENT.LEAVE_GAME);
    this.server.to(gameId).emit(EVENT.UPDATE_PLAYERLIST, payload);
  }

  @SubscribeMessage(EVENT.DESTROY_GAME)
  async handleDestroyGame(client: Socket, gameId: string): Promise<void> {
    const { error } = await this.gameService.destroy(gameId);

    if (error) {
      client.emit(EVENT.MESSAGE, error);
      return;
    }

    this.server.to(gameId).emit(EVENT.DESTROY_GAME);
  }

  @SubscribeMessage(EVENT.BUTTON_DOWN)
  async handleButtonDown(client: Socket, button: string): Promise<void> {
    const gameId = await this.gameService.getGameIdByPlayerId(client.id);
    this.server.to(gameId).emit(EVENT.BUTTON_DOWN, button);
  }

  @SubscribeMessage(EVENT.BUTTON_UP)
  async handleButtonUp(client: Socket, button: string): Promise<void> {
    const gameId = await this.gameService.getGameIdByPlayerId(client.id);
    this.server.to(gameId).emit(EVENT.BUTTON_UP, button);
  }

  @SubscribeMessage(EVENT.GAMEOVER)
  async handleGameOver(client: Socket): Promise<void> {
    client.emit(EVENT.UPDATE_GAME_PROGRESS, GameProgress.GAMEOVER);
  }

  public handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);

    console.log(this.server);
  }

  public async handleDisconnect(client: Socket): Promise<void> {
    this.logger.log(`Client disconnected: ${client.id}`);
    const { error, payload } = await this.gameService.disconnected(client.id);

    if (error) {
      this.server.to(payload).emit(EVENT.MESSAGE, error);
      return;
    }

    await this.handleLeaveGame(client, payload);
  }
}
