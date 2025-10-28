/*
  Warnings:

  - You are about to drop the column `status` on the `document_chunks` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."document_chunks_status_idx";

-- AlterTable
ALTER TABLE "public"."document_chunks" DROP COLUMN "status",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "document_chunks_isActive_idx" ON "public"."document_chunks"("isActive");
