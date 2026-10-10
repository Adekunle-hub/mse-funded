import { ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest } from '../auth/auth.guard.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly users: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (await this.users.isAdmin(request.userId)) return true;
    throw new ForbiddenException('Only admins can do this');
  }
}
