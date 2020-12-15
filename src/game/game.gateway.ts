import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';

import { GameService } from './game.service';
import { Game, GameMode } from '../types/game.type';

@WebSocketGateway()
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger: Logger = new Logger('GameGateway');

  @WebSocketServer()
  public server: Server;

  constructor(private readonly gameService: GameService) {}

  @SubscribeMessage('create-game')
  async handleCreateGame(client: Socket, mode: GameMode): Promise<Game> {
    const game = await this.gameService.create(client.id, mode);
    client.join(game.id);
    return game;
  }

  @SubscribeMessage('join-game')
  async handleJoinGame(client: Socket, gameId: string): Promise<Game> {
    const game = await this.gameService.join(client.id, gameId);
    client.join(game.id);
    return game;
  }

  @SubscribeMessage('destroy-game')
  async handleDesroyGame(client: Socket, mode: GameMode): Promise<Game> {
    const game = await this.gameService.create(client.id, mode);
    client.join(game.id);
    return game;
  }

  public async afterInit(): Promise<void> {
    this.logger.debug(`Current Game List : ${await this.gameService.getAll()}`);
  }

  public handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  public handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
