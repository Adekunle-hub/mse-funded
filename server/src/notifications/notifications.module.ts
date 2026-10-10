import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { runWorkers } from '../config/jobs.js';
import { NOTIFY_QUEUE } from '../queues.js';
import { NotificationsService } from './notifications.service.js';
import { NotifyProcessor } from './notify.processor.js';
import { RemindersController } from './reminders.controller.js';
import { RemindersService } from './reminders.service.js';

@Module({
  imports: [BullModule.registerQueue({ name: NOTIFY_QUEUE })],
  controllers: [RemindersController],
  providers: [NotificationsService, RemindersService, ...(runWorkers ? [NotifyProcessor] : [])],
  exports: [NotificationsService, RemindersService],
})
export class NotificationsModule {}
