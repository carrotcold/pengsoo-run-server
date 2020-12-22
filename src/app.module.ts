import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';
import { RedisCacheModule } from './redisCache/redisCache.module';

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
