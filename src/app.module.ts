import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RedisCacheModule } from './cache/redisCache.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisCacheModule,
    GameModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
