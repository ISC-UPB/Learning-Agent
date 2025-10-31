-- CreateTable
CREATE TABLE "public"."DeadLetter" (
    "id" SERIAL NOT NULL,
    "jobId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeadLetter_pkey" PRIMARY KEY ("id")
);
