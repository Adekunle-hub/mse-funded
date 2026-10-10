import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Put, UseGuards } from '@nestjs/common';

import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUserId } from '../auth/current-user-id.decorator.js';
import { UpdateSavedDto } from './dto/update-saved.dto.js';
import { SavedService } from './saved.service.js';

@UseGuards(AuthGuard)
@Controller('me/saved')
export class SavedController {
  constructor(private readonly saved: SavedService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.saved.list(userId);
  }

  @Put(':id')
  save(@CurrentUserId() userId: string, @Param('id') id: string, @Body() dto: UpdateSavedDto) {
    return this.saved.save(userId, id, dto);
  }

  @Patch(':id')
  update(@CurrentUserId() userId: string, @Param('id') id: string, @Body() dto: UpdateSavedDto) {
    return this.saved.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.saved.remove(userId, id);
  }
}
