import { Module } from '@nestjs/common';

import { WebsiteService } from './website.service.js';

@Module({
  providers: [WebsiteService],
  exports: [WebsiteService],
})
export class WebsiteModule {}
