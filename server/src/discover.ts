import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { DiscoveryService } from './discovery/discovery.service.js';

const app = await NestFactory.createApplicationContext(AppModule);
const added = await app.get(DiscoveryService).discover();
console.log({ added });
await app.close();
