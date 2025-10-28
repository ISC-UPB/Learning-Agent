-- CreateTable
CREATE TABLE "public"."quiz_questions" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."interview_questions" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "interview_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quiz_questions_signature_key" ON "public"."quiz_questions"("signature");

-- CreateIndex
CREATE INDEX "quiz_questions_classId_idx" ON "public"."quiz_questions"("classId");

-- CreateIndex
CREATE INDEX "quiz_questions_createdAt_idx" ON "public"."quiz_questions"("createdAt");

-- CreateIndex
CREATE INDEX "quiz_questions_lastUsedAt_idx" ON "public"."quiz_questions"("lastUsedAt");

-- CreateIndex
CREATE UNIQUE INDEX "interview_questions_signature_key" ON "public"."interview_questions"("signature");

-- CreateIndex
CREATE INDEX "interview_questions_classId_idx" ON "public"."interview_questions"("classId");

-- CreateIndex
CREATE INDEX "interview_questions_createdAt_idx" ON "public"."interview_questions"("createdAt");

-- CreateIndex
CREATE INDEX "interview_questions_lastUsedAt_idx" ON "public"."interview_questions"("lastUsedAt");

-- AddForeignKey
ALTER TABLE "public"."quiz_questions" ADD CONSTRAINT "quiz_questions_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interview_questions" ADD CONSTRAINT "interview_questions_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
