import { Module } from '@nestjs/common';

import { AvatarController } from './avatar.controller.js';
import { UsersService } from './users.service.js';

@Module({
  controllers: [AvatarController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
