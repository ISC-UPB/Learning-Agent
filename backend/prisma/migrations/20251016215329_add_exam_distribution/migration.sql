-- CreateTable
CREATE TABLE "public"."ExamDistribution" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamDistribution_examId_idx" ON "public"."ExamDistribution"("examId");

-- CreateIndex
CREATE INDEX "ExamDistribution_userId_idx" ON "public"."ExamDistribution"("userId");

-- AddForeignKey
ALTER TABLE "public"."ExamDistribution" ADD CONSTRAINT "ExamDistribution_examId_fkey" FOREIGN KEY ("examId") REFERENCES "public"."Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
