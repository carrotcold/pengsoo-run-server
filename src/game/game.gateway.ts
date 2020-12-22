import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsResponse,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';

import { Game, GameMode, GameProgress, Player } from './game.type';
import { EVENT } from './game.constant';
import { GameService } from './game.service';

@WebSocketGateway()
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger: Logger = new Logger('GameGateway');

  @WebSocketServer()
  public server: Server;

  constructor(private readonly gameService: GameService) {}

  @SubscribeMessage(EVENT.CREATE_GAME)
  async handleCreateGame(client: Socket, mode: GameMode): Promise<void> {
    const { error, payload } = await this.gameService.create(client.id, mode);

    if (error) return this.throwMessage(client, error);

    const newGame: Game = payload;

    client.join(newGame.id);
    client.emit(EVENT.CREATE_GAME, newGame);
  }

  @SubscribeMessage(EVENT.JOIN_GAME)
  async handleJoinGame(client: Socket, gameId: string): Promise<void> {
    const { error, payload } = await this.gameService.join(client.id, gameId);

    if (error) return this.throwMessage(client, error);

    const playerList: Player[] = payload;
    const newPlayer = playerList.find(player => player.id === client.id);

    client.join(gameId);
    this.server.to(gameId).emit(EVENT.UPDATE_PLAYERLIST, playerList);
    client.emit(EVENT.JOIN_GAME, newPlayer);
  }

  @SubscribeMessage(EVENT.START_GAME)
  async handleStartGame(client: Socket, gameId: string): Promise<void> {
    const { error, payload } = await this.gameService.start(gameId);

    if (error) return this.throwMessage(client, error);

    this.server.to(gameId).emit(EVENT.UPDATE_GAME_PROGRESS, payload);
  }

  @SubscribeMessage(EVENT.LEAVE_GAME)
  async handleLeaveGame(client: Socket, gameId: string): Promise<void> {
    const { error, payload } = await this.gameService.leave(client.id, gameId);

    if (error) return this.throwMessage(client, error);

    client.leave(gameId);
    client.emit(EVENT.LEAVE_GAME);

    this.server.to(gameId).emit(EVENT.UPDATE_PLAYERLIST, payload);
  }

  @SubscribeMessage(EVENT.DESTROY_GAME)
  async handleDestroyGame(client: Socket, gameId: string): Promise<void> {
    const { error, payload } = await this.gameService.destroy(gameId);

    if (error) return this.throwMessage(client, error);

    this.server.to(gameId).emit(EVENT.MESSAGE, payload);
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
  async handleGameOver(): Promise<WsResponse<GameProgress>> {
    return { event: EVENT.UPDATE_GAME_PROGRESS, data: GameProgress.GAMEOVER };
  }

  public handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  public async handleDisconnect(client: Socket): Promise<void> {
    this.logger.log(`Client disconnected: ${client.id}`);

    const gameIdByHost = await this.gameService.getGameIdByHostId(client.id);

    if (gameIdByHost) {
      await this.handleDestroyGame(client, gameIdByHost);
      return;
    }

    const gameIdByPlayer = await this.gameService.getGameIdByPlayerId(client.id);

    if (gameIdByPlayer) {
      await this.handleLeaveGame(client, gameIdByPlayer);
      return;
    }
  }

  private throwMessage(client: Socket, message: string): void {
    client.emit(EVENT.MESSAGE, message);
  }
}
