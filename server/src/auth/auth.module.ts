import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import type { Env } from '../config/env.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { GoogleAuthService } from './google-auth.service.js';

@Global()
@Module({
  imports: [
    UsersModule,
    NotificationsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: { expiresIn: `${config.get('ACCESS_TOKEN_TTL_MINUTES', { infer: true })}m` },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, GoogleAuthService],
  exports: [AuthGuard, JwtModule],
})
export class AuthModule {}
