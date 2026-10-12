import type { ExtractedOpportunity, Prisma } from '../generated/prisma/client.js';
import type { Opportunity } from '../extraction/extraction.schema.js';

const FIELD_KEYWORDS: [string, RegExp][] = [
  ['Polymers', /polymer|plastic|rubber|elastomer/i],
  ['Ceramics', /ceramic|glass|concrete|cement/i],
  ['Metals', /metal|alloy|metallurg|steel|nickel|titanium|aluminium|aluminum/i],
  ['Nanomaterials', /nano|2d material|graphene/i],
  ['Composites', /composite/i],
  ['Corrosion', /corrosion|coating/i],
  ['Manufacturing', /manufactur|additive|3d print|welding|machining|forging|materials processing/i],
  ['Sustainable energy', /sustainab|renewable|energy|solar|photovoltaic|hydrogen|fuel cell|batter|net zero|carbon capture|electrolys/i],
];

const ZONE_LABELS: Record<string, string> = {
  'Europe/London': 'UK time',
  'Europe/Berlin': 'CET',
  'Europe/Paris': 'CET',
  'Europe/Amsterdam': 'Dutch time',
  'Europe/Stockholm': 'Swedish time',
  'Asia/Riyadh': 'Saudi time',
  'America/New_York': 'US Eastern time',
  'America/Toronto': 'Toronto time',
  'Africa/Lagos': 'Lagos time',
  UTC: 'UTC',
};

export function slugFor(title: string, institution: string): string {
  return `${title} ${institution}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90)
    .replace(/-$/, '');
}

export function fieldsFor(opportunity: Opportunity): string[] {
  const topics = opportunity.materialsFocus === 'general' ? [] : opportunity.fields;
  const text = [opportunity.title, ...topics].join(' ');
  return FIELD_KEYWORDS.filter(([, pattern]) => pattern.test(text)).map(([field]) => field);
}

function intakeYear(opportunity: Opportunity, deadline: Date | null): number {
  const year = Number(opportunity.startDate?.match(/\b20\d{2}\b/)?.[0]);
  return Number.isFinite(year) && year > 0 ? year : (deadline ?? new Date()).getUTCFullYear();
}

function openTo(opportunity: Opportunity): string {
  return opportunity.openToNigerians ? 'International students, including Nigeria' : 'Check eligibility on the official page';
}

export function toScholarship(
  row: ExtractedOpportunity,
  opportunity: Opportunity,
  deadline: Date | null,
): Prisma.ScholarshipUncheckedCreateInput {
  const zone = opportunity.deadlineTimeZone && ZONE_LABELS[opportunity.deadlineTimeZone] ? opportunity.deadlineTimeZone : 'UTC';
  const unconfirmed = opportunity.openToNigerians === null;

  return {
    slug: slugFor(opportunity.title, opportunity.institution),
    name: opportunity.title,
    funder: opportunity.funder ?? opportunity.institution,
    institution: opportunity.institution,
    department: opportunity.department,
    country: opportunity.country ?? 'Multiple countries',
    city: opportunity.city,
    level: opportunity.level,
    fundingType: opportunity.fundingType,
    fields: fieldsFor(opportunity),
    fundingSummary: opportunity.fundingSummary,
    startDate: opportunity.startDate,
    openTo: openTo(opportunity),
    openToNigerians: opportunity.openToNigerians === true,
    intakeYear: intakeYear(opportunity, deadline),
    deadline,
    deadlineTimeZone: zone,
    deadlineZoneLabel: ZONE_LABELS[zone],
    eligibility: opportunity.eligibility,
    about: [opportunity.summary],
    howToApply: opportunity.howToApply,
    officialUrl: opportunity.officialUrl ?? '',
    status: unconfirmed ? 'UNDER_REVIEW' : 'PUBLISHED',
    reviewNote: unconfirmed ? 'We could not confirm that international students can apply. Check the official page.' : null,
    verifiedAt: new Date(),
    rawPageId: row.rawPageId,
  };
}
