import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as helmet from 'helmet';

import { AppModule } from './app.module';
import { RedisIoAdapter } from './adapters/redis.adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: process.env.CLIENT_URL,
      optionsSuccessStatus: 200,
    },
  });

  app.use(helmet());
  app.useWebSocketAdapter(new RedisIoAdapter(app));

  const port = process.env.PORT || 3000;

  await app.listen(port, () => console.log(`listening on ${port}`));
}

bootstrap();
