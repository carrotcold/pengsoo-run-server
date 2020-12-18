import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RedisCacheModule } from './redisCache/redisCache.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisCacheModule,
    GameModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
