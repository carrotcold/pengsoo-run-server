import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
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

  @SubscribeMessage('createGame')
  async handleCreateGame(client: Socket, mode: GameMode): Promise<void> {
    const game = await this.gameService.create(client.id, mode);
    client.join(game.id);
    client.emit('createGame', game);
  }

  @SubscribeMessage('joinGame')
  async handleJoinGame(client: Socket, gameId: string): Promise<void> {
    const playerList = await this.gameService.join(client.id, gameId);

    if (!playerList) {
      client.emit('joinGame', 'Game is Full');
      return;
    }

    const newPlayer = playerList.find(player => player.id === client.id);

    client.emit('joinGame', newPlayer);
    this.server.to(gameId).emit('updatePlayerList', playerList);
  }

  @SubscribeMessage('destroyGame')
  async handleDestroyGame(client: Socket, mode: GameMode): Promise<Game> {
    const game = await this.gameService.create(client.id, mode);
    client.join(game.id);
    return game;
  }

  @SubscribeMessage('buttonDown')
  async handleButtonDown(client: Socket, data: any): Promise<void> {
    const { gameId, button } = data;
    console.log('✅   handleButtonDown   button', button);
    this.server.to(gameId).emit('buttonDown', button);
  }

  @SubscribeMessage('buttonUp')
  async handleButtonUp(client: Socket, data: any): Promise<void> {
    const { gameId, button } = data;
    console.log('✅   handleButtonUp   button', button);
    this.server.to(gameId).emit('buttonUp', button);
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
