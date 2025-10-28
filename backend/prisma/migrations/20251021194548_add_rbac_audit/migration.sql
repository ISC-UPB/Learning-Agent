-- CreateTable
CREATE TABLE "public"."RbacAudit" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,

    CONSTRAINT "RbacAudit_pkey" PRIMARY KEY ("id")
);
