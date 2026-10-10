-- CreateEnum
CREATE TYPE "SourceOrigin" AS ENUM ('SEED', 'LISTING', 'SEARCH', 'SUBMITTED');

-- AlterEnum
ALTER TYPE "SourceKind" ADD VALUE 'LISTING';

-- AlterTable
ALTER TABLE "Source" ADD COLUMN     "origin" "SourceOrigin" NOT NULL DEFAULT 'SEED';
