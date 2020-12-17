import { IoAdapter } from '@nestjs/platform-socket.io';
import * as redisIoAdapter from 'socket.io-redis';

export class RedisIoAdapter extends IoAdapter {
  createIOServer(port: number): any {
    const server = super.createIOServer(port);
    const redisAdapter = redisIoAdapter({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      auth_pass: process.env.REDIS_PASSWORD,
    });

    server.adapter(redisAdapter);
    return server;
  }
}
