/*
  Warnings:

  - Added the required column `updatedAt` to the `ProcessingJob` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ProcessingJob" ADD COLUMN     "contentHash" TEXT,
ADD COLUMN     "parentJobId" TEXT,
ADD COLUMN     "progressMessage" TEXT,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "ProcessingJob_contentHash_idx" ON "public"."ProcessingJob"("contentHash");

-- CreateIndex
CREATE INDEX "ProcessingJob_parentJobId_idx" ON "public"."ProcessingJob"("parentJobId");
