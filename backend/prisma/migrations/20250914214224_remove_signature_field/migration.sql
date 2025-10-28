/*
  Warnings:

  - You are about to drop the column `signature` on the `interview_questions` table. All the data in the column will be lost.
  - You are about to drop the column `signature` on the `quiz_questions` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."interview_questions_signature_key";

-- DropIndex
DROP INDEX "public"."quiz_questions_signature_key";

-- AlterTable
ALTER TABLE "public"."interview_questions" DROP COLUMN "signature";

-- AlterTable
ALTER TABLE "public"."quiz_questions" DROP COLUMN "signature";
