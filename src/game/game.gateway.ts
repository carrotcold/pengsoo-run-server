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

@WebSocketGateway()
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger: Logger = new Logger('GameGateway');

  @WebSocketServer()
  public server: Server;

  constructor(private readonly gameService: GameService) {}

  // @SubscribeMessage('create-game')
  // handleCreateGame(client: Socket, data: number): string {
  //   this.logger.log(`${gameId} is created`);
  //   client.join(gameId);
  //   return gameId;
  // }

  @SubscribeMessage('chat')
  public handleEvent(data: string): string {
    this.logger.log(data);
    console.log(data);
    return data;
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
