/*
  Warnings:

  - A unique constraint covering the columns `[documentId,jobType]` on the table `ProcessingJob` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[documentId,chunkHash]` on the table `document_chunks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chunkHash` to the `document_chunks` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."ProcessingJob_documentId_jobType_idx";

-- AlterTable
ALTER TABLE "public"."document_chunks" ADD COLUMN     "chunkHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingJob_documentId_jobType_key" ON "public"."ProcessingJob"("documentId", "jobType");

-- CreateIndex
CREATE UNIQUE INDEX "document_chunks_documentId_chunkHash_key" ON "public"."document_chunks"("documentId", "chunkHash");
