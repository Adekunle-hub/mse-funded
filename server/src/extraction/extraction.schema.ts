import { z } from 'zod';

export const ScreeningSchema = z.object({
  relevant: z.boolean(),
  reason: z.string(),
});

export const OpportunitySchema = z.object({
  title: z.string(),
  funder: z.string().nullable(),
  institution: z.string(),
  department: z.string().nullable(),
  country: z.string().nullable(),
  city: z.string().nullable(),
  materialsFocus: z.enum(['core', 'related', 'general', 'unrelated']),
  level: z.enum(['MSC', 'PHD', 'MSC_PHD']),
  fundingType: z.enum(['FULLY_FUNDED', 'TUITION_ONLY', 'STIPEND_ONLY', 'PARTIAL']),
  fundingSummary: z.string(),
  fields: z.array(z.string()),
  deadline: z.string().nullable(),
  deadlineTimeZone: z.string().nullable(),
  startDate: z.string().nullable(),
  openToNigerians: z.boolean().nullable(),
  eligibility: z.array(z.string()),
  howToApply: z.array(z.string()),
  summary: z.string(),
  officialUrl: z.string().nullable(),
});

export const ExtractionSchema = z.object({
  opportunities: z.array(OpportunitySchema),
});

export type Opportunity = z.infer<typeof OpportunitySchema>;
