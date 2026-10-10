import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import type { Env } from '../config/env.js';
import { closesIn } from './reminders.js';

export type Email = { to: string; subject: string; text: string; html: string; headers?: Record<string, string> };

export type DeadlineReminder = {
  to: string;
  name: string;
  title: string;
  institution: string;
  daysLeft: number;
  deadline: string;
  officialUrl: string;
  savedUrl: string;
  stopUrl: string;
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly production: boolean;

  constructor(config: ConfigService<Env, true>) {
    const key = config.get('RESEND_API_KEY', { infer: true });
    this.resend = key ? new Resend(key) : null;
    this.from = config.get('EMAIL_FROM', { infer: true });
    this.production = config.get('NODE_ENV', { infer: true }) === 'production';
  }

  async sendPasswordReset(to: string, name: string, link: string): Promise<void> {
    const greeting = `Hi ${name},`;
    await this.send({
      to,
      subject: 'Reset your MseFunded password',
      text: `${greeting}\n\nUse this link to choose a new password. It works once and expires in 30 minutes:\n${link}\n\nIf you did not ask for this, you can ignore this email. Your password stays the same.`,
      html: `<p>${escapeHtml(greeting)}</p><p>Use this link to choose a new password. It works once and expires in 30 minutes.</p><p><a href="${escapeHtml(link)}">Choose a new password</a></p><p>If you did not ask for this, you can ignore this email. Your password stays the same.</p>`,
    });
  }

  async sendDeadlineReminder(reminder: DeadlineReminder): Promise<void> {
    const when = closesIn(reminder.daysLeft);
    const e = escapeHtml;

    await this.send({
      to: reminder.to,
      subject: `${when}: ${reminder.title}`,
      headers: {
        'List-Unsubscribe': `<${reminder.stopUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      text: [
        `Hi ${reminder.name},`,
        '',
        `${when}: ${reminder.title}, ${reminder.institution}.`,
        `Deadline: ${reminder.deadline}`,
        '',
        `Official page: ${reminder.officialUrl}`,
        `Your saved scholarships: ${reminder.savedUrl}`,
        '',
        `Stop reminders for this scholarship: ${reminder.stopUrl}`,
      ].join('\n'),
      html: `<div style="font-family:Arial,Helvetica,sans-serif;color:#061d29;max-width:520px;margin:0 auto;padding:24px 16px;font-size:15px;line-height:1.5">
<p style="margin:0 0 4px;color:#006e75;font-weight:bold">${e(when)}</p>
<h1 style="margin:0 0 4px;font-size:20px;line-height:1.3">${e(reminder.title)}</h1>
<p style="margin:0 0 16px;color:#4b5563">${e(reminder.institution)}</p>
<p style="margin:0 0 20px;padding:12px 14px;border:1px solid #e5e7eb;border-radius:6px"><strong>Deadline</strong><br>${e(reminder.deadline)}</p>
<p style="margin:0 0 12px"><a href="${e(reminder.officialUrl)}" style="display:inline-block;background:#006e75;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold">Open the official page</a></p>
<p style="margin:0 0 24px"><a href="${e(reminder.savedUrl)}" style="color:#006e75">See your saved scholarships</a></p>
<p style="margin:0;padding-top:16px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280">You get this because you saved this scholarship on MseFunded. <a href="${e(reminder.stopUrl)}" style="color:#6b7280">Stop reminders for this scholarship</a></p>
</div>`,
    });
  }

  private async send(email: Email): Promise<void> {
    if (!this.resend) {
      if (this.production) throw new Error('RESEND_API_KEY is not set, so emails cannot be sent');
      this.logger.warn(`RESEND_API_KEY is not set. Email to ${email.to}: ${email.subject}\n${email.text}`);
      return;
    }

    const { error } = await this.resend.emails.send({ from: this.from, ...email });
    if (error) throw new Error(`Email could not be sent: ${error.message}`);
  }
}
