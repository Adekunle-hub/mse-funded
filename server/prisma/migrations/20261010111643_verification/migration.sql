-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'MERGED', 'NEEDS_REVIEW', 'REJECTED');

-- AlterTable
ALTER TABLE "ExtractedOpportunity" ADD COLUMN     "note" TEXT,
ADD COLUMN     "scholarshipId" UUID,
ADD COLUMN     "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "ExtractedOpportunity_status_idx" ON "ExtractedOpportunity"("status");

-- AddForeignKey
ALTER TABLE "ExtractedOpportunity" ADD CONSTRAINT "ExtractedOpportunity_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE SET NULL ON UPDATE CASCADE;
