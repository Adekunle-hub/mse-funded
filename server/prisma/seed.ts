import { PrismaPg } from "@prisma/adapter-pg"

import {
  FundingType,
  ListingStatus,
  PrismaClient,
  SourceKind,
  StudyLevel,
  type Prisma,
} from "../src/generated/prisma/client.js"
import { scholarshipSeed } from "../src/shared/data/scholarship-seed.js"
import type { ScholarshipDetail } from "../src/shared/types/scholarship.js"
import sources from "./sources.json" with { type: "json" }

try {
  process.loadEnvFile(".env")
} catch {}

const databaseUrl = new URL(process.env.DATABASE_URL ?? "")
const schema = databaseUrl.searchParams.get("schema") ?? undefined
databaseUrl.searchParams.delete("schema")
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl.toString() }, { schema }) })

const levels: Record<ScholarshipDetail["level"], StudyLevel> = {
  msc: StudyLevel.MSC,
  phd: StudyLevel.PHD,
  "msc-phd": StudyLevel.MSC_PHD,
}

const fundingTypes: Record<ScholarshipDetail["fundingType"], FundingType> = {
  "fully-funded": FundingType.FULLY_FUNDED,
  "tuition-only": FundingType.TUITION_ONLY,
  "stipend-only": FundingType.STIPEND_ONLY,
  partial: FundingType.PARTIAL,
}

function intakeYear(item: ScholarshipDetail) {
  const year = Number(item.startDate.match(/\d{4}/)?.[0])
  return Number.isFinite(year) ? year : new Date(item.deadline ?? Date.now()).getUTCFullYear()
}

function toRow(item: ScholarshipDetail): Prisma.ScholarshipCreateInput {
  return {
    slug: item.id,
    name: item.title,
    funder: item.funder,
    institution: item.institution,
    department: item.department,
    country: item.country,
    city: item.city,
    level: levels[item.level],
    fundingType: fundingTypes[item.fundingType],
    fields: item.fields,
    fundingSummary: item.fundingSummary,
    fundingCovers: item.fundingCovers,
    durationLabel: item.durationLabel,
    startDate: item.startDate,
    openTo: item.openTo,
    openToNigerians: /nigeria|developing countries|international/i.test(item.openTo),
    intakeYear: intakeYear(item),
    deadline: item.deadline ? new Date(item.deadline) : null,
    deadlineTimeZone: item.deadlineZone.id,
    deadlineZoneLabel: item.deadlineZone.label,
    eligibility: item.eligibility,
    about: item.about,
    howToApply: item.howToApply,
    officialUrl: item.officialUrl,
    status: ListingStatus.DRAFT,
    verifiedAt: new Date(item.verification.checkedAt),
    reviewNote: item.verification.note,
    createdAt: new Date(item.addedAt),
  }
}


async function main() {
  for (const item of scholarshipSeed) {
    const row = toRow(item)
    await prisma.scholarship.upsert({ where: { slug: row.slug }, create: row, update: row })
  }
  const total = await prisma.scholarship.count()
  console.log(`Seeded ${scholarshipSeed.length} sample scholarships as drafts, hidden from the site (${total} in the table).`)

  for (const source of sources) {
    const kind = source.kind === "LISTING" ? SourceKind.LISTING : SourceKind.HTML
    await prisma.source.upsert({
      where: { url: source.url },
      create: { name: source.name, url: source.url, kind },
      update: { name: source.name, kind },
    })
  }
  console.log(`Seeded ${sources.length} crawl sources.`)
}

try {
  await main()
} finally {
  await prisma.$disconnect()
}
