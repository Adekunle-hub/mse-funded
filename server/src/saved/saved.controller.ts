import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Put, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import { SessionService } from '../session/session.service.js';
import { SavedService } from './saved.service.js';

@Controller('me/saved')
export class SavedController {
  constructor(
    private readonly saved: SavedService,
    private readonly sessions: SessionService,
  ) {}

  private owner(request: Request, response: Response) {
    return this.sessions.ownerKey(this.sessions.ensure(request, response));
  }

  @Get()
  list(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    return this.saved.list(this.owner(request, response));
  }

  @Put(':id')
  save(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.saved.save(this.owner(request, response), id, body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.saved.update(this.owner(request, response), id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    this.saved.remove(this.owner(request, response), id);
  }
}
