-- DropIndex
DROP INDEX "public"."ProcessingJob_documentId_jobType_status_key";

-- CreateIndex
CREATE INDEX "ProcessingJob_documentId_jobType_status_idx" ON "public"."ProcessingJob"("documentId", "jobType", "status");
