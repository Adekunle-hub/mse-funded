import { Controller, Get, HttpCode, Post, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import type { Env } from '../config/env.js';
import { siteUrl } from '../config/urls.js';
import { RemindersService } from './reminders.service.js';

@Controller('reminders')
export class RemindersController {
  private readonly siteUrl: string;

  constructor(
    private readonly reminders: RemindersService,
    config: ConfigService<Env, true>,
  ) {
    this.siteUrl = siteUrl(config);
  }

  @Get('stop')
  async stopFromEmail(@Query('id') id: unknown, @Query('sig') sig: unknown, @Res() response: Response) {
    const stopped = await this.reminders.stop(id, sig);
    return response.redirect(`${this.siteUrl}/reminders-stopped${stopped ? '' : '?invalid=1'}`);
  }

  @Post('stop')
  @HttpCode(200)
  async stopFromMailApp(@Query('id') id: unknown, @Query('sig') sig: unknown) {
    return { stopped: await this.reminders.stop(id, sig) };
  }
}
