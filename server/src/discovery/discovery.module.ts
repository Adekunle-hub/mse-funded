import { Module } from '@nestjs/common';

import { SourcesModule } from '../sources/sources.module.js';
import { DiscoveryService } from './discovery.service.js';

@Module({
  imports: [SourcesModule],
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
