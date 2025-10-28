-- AlterTable
ALTER TABLE "public"."document_chunks" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "document_chunks_status_idx" ON "public"."document_chunks"("status");
