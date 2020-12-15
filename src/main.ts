import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as helmet from 'helmet';

import { AppModule } from './app.module';
import { RedisIoAdapter } from './adapters/redis.adapter';
import { develop, prod } from './config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    process.env.NODE_ENV === 'development' ? develop : prod,
  );

  console.log('✅process.env.NODE_ENV', process.env.NODE_ENV);
  app.use(helmet());
  app.useWebSocketAdapter(new RedisIoAdapter(app));

  const port = process.env.SERVER_PORT || 8080;

  await app.listen(port, () => console.log(`listening on ${port}`));
}

bootstrap();
