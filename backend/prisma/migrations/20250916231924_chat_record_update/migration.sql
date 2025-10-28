-- AlterTable
ALTER TABLE "public"."chat_history" ADD COLUMN     "uses" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "chat_history_docId_question_idx" ON "public"."chat_history"("docId", "question");
