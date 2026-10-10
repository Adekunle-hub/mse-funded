export const CRAWL_QUEUE = 'crawl';
export const EXTRACT_QUEUE = 'extract';
export const VERIFY_QUEUE = 'verify';
export const NOTIFY_QUEUE = 'notify';

export type CrawlJob = { sourceId: string };
export type ExtractJob = { rawPageId: string };
export type VerifyJob = { opportunityId: string };
export type RecheckJob = { scholarshipId: string };
export type NotifyJob = { reminderId: string };
