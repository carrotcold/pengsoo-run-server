import { Module } from '@nestjs/common';
import { GameModule } from './game-events/game.module';

@Module({
  imports: [GameModule],
})
export class AppModule {}
