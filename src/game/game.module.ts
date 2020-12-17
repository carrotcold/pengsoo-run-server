import { Module } from '@nestjs/common';

import { RedisCacheModule } from '../redisCache/redisCache.module';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';

@Module({
  imports: [RedisCacheModule],
  providers: [GameGateway, GameService],
})
export class GameModule {}
