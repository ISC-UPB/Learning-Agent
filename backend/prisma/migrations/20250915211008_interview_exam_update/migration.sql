/*
  Warnings:

  - You are about to drop the column `classId` on the `interview_questions` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `interview_questions` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `quiz_questions` table. All the data in the column will be lost.
  - Added the required column `courseId` to the `interview_questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `docId` to the `interview_questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseId` to the `quiz_questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `docId` to the `quiz_questions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."interview_questions" DROP CONSTRAINT "interview_questions_classId_fkey";

-- DropForeignKey
ALTER TABLE "public"."quiz_questions" DROP CONSTRAINT "quiz_questions_classId_fkey";

-- DropIndex
DROP INDEX "public"."interview_questions_classId_idx";

-- DropIndex
DROP INDEX "public"."quiz_questions_classId_idx";

-- AlterTable
ALTER TABLE "public"."interview_questions" DROP COLUMN "classId",
DROP COLUMN "text",
ADD COLUMN     "courseId" TEXT NOT NULL,
ADD COLUMN     "docId" TEXT NOT NULL,
ADD COLUMN     "json" JSONB;

-- AlterTable
ALTER TABLE "public"."quiz_questions" DROP COLUMN "classId",
ADD COLUMN     "courseId" TEXT NOT NULL,
ADD COLUMN     "docId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "interview_questions_courseId_docId_idx" ON "public"."interview_questions"("courseId", "docId");

-- CreateIndex
CREATE INDEX "quiz_questions_courseId_docId_idx" ON "public"."quiz_questions"("courseId", "docId");

-- AddForeignKey
ALTER TABLE "public"."quiz_questions" ADD CONSTRAINT "quiz_questions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quiz_questions" ADD CONSTRAINT "quiz_questions_docId_fkey" FOREIGN KEY ("docId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interview_questions" ADD CONSTRAINT "interview_questions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."interview_questions" ADD CONSTRAINT "interview_questions_docId_fkey" FOREIGN KEY ("docId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
