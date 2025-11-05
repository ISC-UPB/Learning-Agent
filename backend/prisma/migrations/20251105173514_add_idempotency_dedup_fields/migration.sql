/*
  Warnings:

  - The primary key for the `DeadLetter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `payload` column on the `DeadLetter` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `RbacAudit` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[documentId,jobType,status]` on the table `ProcessingJob` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[documentId,contentHash]` on the table `document_chunks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `ProcessingJob` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contentHash` to the `document_chunks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."DeadLetter" DROP CONSTRAINT "DeadLetter_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
DROP COLUMN "payload",
ADD COLUMN     "payload" JSONB,
ALTER COLUMN "attempts" SET DEFAULT 0,
ADD CONSTRAINT "DeadLetter_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "DeadLetter_id_seq";

-- AlterTable
ALTER TABLE "public"."ProcessingJob" ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastProcessedChunkIndex" INTEGER,
ADD COLUMN     "processedChunksCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "processedEmbeddingsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."document_chunks" ADD COLUMN     "contentHash" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."RbacAudit";

-- CreateTable
CREATE TABLE "public"."rbac_audit" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,

    CONSTRAINT "rbac_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingJob_documentId_jobType_status_key" ON "public"."ProcessingJob"("documentId", "jobType", "status");

-- CreateIndex
CREATE INDEX "document_chunks_contentHash_idx" ON "public"."document_chunks"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "document_chunks_documentId_contentHash_key" ON "public"."document_chunks"("documentId", "contentHash");
