-- CreateTable
CREATE TABLE "public"."chat_history" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "chat_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_history_studentId_docId_idx" ON "public"."chat_history"("studentId", "docId");

-- CreateIndex
CREATE INDEX "chat_history_createdAt_idx" ON "public"."chat_history"("createdAt");

-- CreateIndex
CREATE INDEX "chat_history_lastUsedAt_idx" ON "public"."chat_history"("lastUsedAt");

-- AddForeignKey
ALTER TABLE "public"."chat_history" ADD CONSTRAINT "chat_history_docId_fkey" FOREIGN KEY ("docId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_history" ADD CONSTRAINT "chat_history_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."StudentProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
