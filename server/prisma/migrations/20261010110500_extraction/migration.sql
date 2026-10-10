-- CreateTable
CREATE TABLE "ExtractedOpportunity" (
    "id" UUID NOT NULL,
    "rawPageId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "level" "StudyLevel" NOT NULL,
    "deadline" TIMESTAMP(3),
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractedOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LlmUsage" (
    "id" UUID NOT NULL,
    "rawPageId" UUID,
    "stage" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LlmUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExtractedOpportunity_rawPageId_idx" ON "ExtractedOpportunity"("rawPageId");

-- CreateIndex
CREATE INDEX "ExtractedOpportunity_institution_title_idx" ON "ExtractedOpportunity"("institution", "title");

-- CreateIndex
CREATE INDEX "LlmUsage_createdAt_idx" ON "LlmUsage"("createdAt");

-- AddForeignKey
ALTER TABLE "ExtractedOpportunity" ADD CONSTRAINT "ExtractedOpportunity_rawPageId_fkey" FOREIGN KEY ("rawPageId") REFERENCES "RawPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LlmUsage" ADD CONSTRAINT "LlmUsage_rawPageId_fkey" FOREIGN KEY ("rawPageId") REFERENCES "RawPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
