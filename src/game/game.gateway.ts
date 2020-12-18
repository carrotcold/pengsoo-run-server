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
import { GameMode } from '../types/game.type';

@WebSocketGateway()
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger: Logger = new Logger('GameGateway');

  @WebSocketServer()
  public server: Server;

  constructor(private readonly gameService: GameService) {}

  @SubscribeMessage('createGame')
  async handleCreateGame(client: Socket, mode: GameMode): Promise<void> {
    const { error, payload } = await this.gameService.create(client.id, mode);

    if (error) {
      client.emit('error', error);
      return;
    }

    client.join(payload.id);
    client.emit('createGame', payload);
  }

  @SubscribeMessage('joinGame')
  async handleJoinGame(client: Socket, gameId: string): Promise<void> {
    const { error, payload } = await this.gameService.join(client.id, gameId);

    if (error) {
      client.emit('error', error);
      return;
    }

    const newPlayer = payload.find(player => player.id === client.id);

    client.emit('joinGame', newPlayer);
    this.server.to(gameId).emit('updatePlayerList', payload);
  }

  @SubscribeMessage('leaveGame')
  async handleLeaveGame(client: Socket, gameId: string): Promise<void> {
    const { error, payload } = await this.gameService.leave(client.id, gameId);

    if (error) {
      client.emit('error', error);
      return;
    }

    client.leave(gameId);
    client.emit('leaveGame');
    this.server.to(gameId).emit('updatePlayerList', payload);
  }

  @SubscribeMessage('destroyGame')
  async handleDestroyGame(client: Socket, gameId: string): Promise<void> {
    const { error } = await this.gameService.destroy(gameId);

    if (error) {
      client.emit('error', error);
      return;
    }

    this.server.to(gameId).emit('destroyGame');
  }

  @SubscribeMessage('buttonDown')
  async handleButtonDown(client: Socket, button: string): Promise<void> {
    const gameId = await this.gameService.getGameIdByPlayerId(client.id);
    this.server.to(gameId).emit('buttonDown', button);
  }

  @SubscribeMessage('buttonUp')
  async handleButtonUp(client: Socket, button: string): Promise<void> {
    const gameId = await this.gameService.getGameIdByPlayerId(client.id);
    this.server.to(gameId).emit('buttonUp', button);
  }

  public handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);

    console.log(this.server);
  }

  public handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.gameService.disconnected(client.id);
  }
}
