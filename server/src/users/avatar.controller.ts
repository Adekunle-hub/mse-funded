import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';

import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { UsersService } from './users.service.js';

const MAX_AVATAR_BYTES = 1_000_000;

export function imageType(bytes: Uint8Array): string | null {
  const starts = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  if (starts(0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (starts(0x89, 0x50, 0x4e, 0x47)) return 'image/png';
  if (starts(0x52, 0x49, 0x46, 0x46) && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

@Controller()
export class AvatarController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(AuthGuard)
  @Put('me/avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_AVATAR_BYTES } }))
  async upload(@CurrentUserId() userId: string, @UploadedFile() file: { buffer: Buffer } | undefined) {
    if (!file) throw new BadRequestException('Choose a picture to upload');
    const data = new Uint8Array(file.buffer);
    const type = imageType(data);
    if (!type) throw new BadRequestException('Use a JPG, PNG or WebP picture');
    return { user: await this.users.setAvatar(userId, { data, type }) };
  }

  @UseGuards(AuthGuard)
  @Delete('me/avatar')
  async remove(@CurrentUserId() userId: string) {
    return { user: await this.users.setAvatar(userId, null) };
  }

  @SkipThrottle()
  @Get('users/:id/avatar')
  async show(@Param('id', ParseUUIDPipe) id: string, @Res() response: Response) {
    const user = await this.users.findAvatar(id);
    if (!user?.avatar || !user.avatarType) throw new NotFoundException('No picture');
    response
      .set({
        'Content-Type': user.avatarType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      })
      .send(Buffer.from(user.avatar));
  }
}
