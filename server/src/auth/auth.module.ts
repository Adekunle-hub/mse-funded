import { Module } from '@nestjs/common';

import { SavedModule } from '../saved/saved.module.js';
import { AuthController } from './auth.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [SavedModule],
  controllers: [AuthController],
  providers: [UsersService],
})
export class AuthModule {}
