-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('HTML', 'RSS', 'SITEMAP', 'MANUAL');

-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('PENDING', 'EXTRACTED', 'NOT_A_SCHOLARSHIP', 'FAILED');

-- CreateEnum
CREATE TYPE "StudyLevel" AS ENUM ('MSC', 'PHD', 'MSC_PHD');

-- CreateEnum
CREATE TYPE "FundingType" AS ENUM ('FULLY_FUNDED', 'TUITION_ONLY', 'STIPEND_ONLY', 'PARTIAL');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNDER_REVIEW', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('INTERESTED', 'APPLYING', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "ReminderChannel" AS ENUM ('EMAIL', 'TELEGRAM', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Source" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" "SourceKind" NOT NULL DEFAULT 'HTML',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "crawlIntervalMinutes" INTEGER NOT NULL DEFAULT 1440,
    "robotsAllowed" BOOLEAN,
    "lastCrawledAt" TIMESTAMP(3),
    "lastStatus" INTEGER,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawPage" (
    "id" UUID NOT NULL,
    "sourceId" UUID,
    "url" TEXT NOT NULL,
    "finalUrl" TEXT,
    "httpStatus" INTEGER NOT NULL,
    "contentType" TEXT,
    "contentHash" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extractionStatus" "ExtractionStatus" NOT NULL DEFAULT 'PENDING',
    "extractedAt" TIMESTAMP(3),
    "extractionError" TEXT,

    CONSTRAINT "RawPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scholarship" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "funder" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "department" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "level" "StudyLevel" NOT NULL,
    "fundingType" "FundingType" NOT NULL,
    "fields" TEXT[],
    "fundingSummary" TEXT NOT NULL,
    "fundingCovers" TEXT,
    "durationLabel" TEXT,
    "startDate" TEXT,
    "openTo" TEXT,
    "openToNigerians" BOOLEAN NOT NULL DEFAULT false,
    "intakeYear" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "deadlineTimeZone" TEXT NOT NULL,
    "deadlineZoneLabel" TEXT NOT NULL,
    "eligibility" TEXT[],
    "about" TEXT[],
    "howToApply" TEXT[],
    "officialUrl" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "verifiedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "lastLinkCheckAt" TIMESTAMP(3),
    "lastLinkStatus" INTEGER,
    "rawPageId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "emailVerifiedAt" TIMESTAMP(3),
    "timeZone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedScholarship" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "scholarshipId" UUID NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'INTERESTED',
    "note" TEXT NOT NULL DEFAULT '',
    "remindersOn" BOOLEAN NOT NULL DEFAULT true,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedScholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" UUID NOT NULL,
    "savedScholarshipId" UUID NOT NULL,
    "channel" "ReminderChannel" NOT NULL,
    "daysBefore" INTEGER NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Source_url_key" ON "Source"("url");

-- CreateIndex
CREATE INDEX "Source_isActive_lastCrawledAt_idx" ON "Source"("isActive", "lastCrawledAt");

-- CreateIndex
CREATE INDEX "RawPage_extractionStatus_fetchedAt_idx" ON "RawPage"("extractionStatus", "fetchedAt");

-- CreateIndex
CREATE INDEX "RawPage_sourceId_fetchedAt_idx" ON "RawPage"("sourceId", "fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RawPage_url_contentHash_key" ON "RawPage"("url", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "Scholarship_slug_key" ON "Scholarship"("slug");

-- CreateIndex
CREATE INDEX "Scholarship_status_deadline_idx" ON "Scholarship"("status", "deadline");

-- CreateIndex
CREATE INDEX "Scholarship_country_idx" ON "Scholarship"("country");

-- CreateIndex
CREATE INDEX "Scholarship_level_idx" ON "Scholarship"("level");

-- CreateIndex
CREATE INDEX "Scholarship_fundingType_idx" ON "Scholarship"("fundingType");

-- CreateIndex
CREATE INDEX "Scholarship_fields_idx" ON "Scholarship" USING GIN ("fields");

-- CreateIndex
CREATE UNIQUE INDEX "Scholarship_funder_name_intakeYear_key" ON "Scholarship"("funder", "name", "intakeYear");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "SavedScholarship_userId_status_idx" ON "SavedScholarship"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SavedScholarship_userId_scholarshipId_key" ON "SavedScholarship"("userId", "scholarshipId");

-- CreateIndex
CREATE INDEX "Reminder_status_scheduledFor_idx" ON "Reminder"("status", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "Reminder_savedScholarshipId_channel_daysBefore_key" ON "Reminder"("savedScholarshipId", "channel", "daysBefore");

-- AddForeignKey
ALTER TABLE "RawPage" ADD CONSTRAINT "RawPage_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_rawPageId_fkey" FOREIGN KEY ("rawPageId") REFERENCES "RawPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedScholarship" ADD CONSTRAINT "SavedScholarship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedScholarship" ADD CONSTRAINT "SavedScholarship_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_savedScholarshipId_fkey" FOREIGN KEY ("savedScholarshipId") REFERENCES "SavedScholarship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
