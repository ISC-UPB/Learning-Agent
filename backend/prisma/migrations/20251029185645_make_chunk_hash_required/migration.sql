/*
  Warnings:

  - A unique constraint covering the columns `[documentId,chunkHash]` on the table `document_chunks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `chunkHash` to the `document_chunks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."document_chunks" ADD COLUMN     "chunkHash" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "document_chunks_chunkHash_idx" ON "public"."document_chunks"("chunkHash");

-- CreateIndex
CREATE UNIQUE INDEX "document_chunks_documentId_chunkHash_key" ON "public"."document_chunks"("documentId", "chunkHash");
