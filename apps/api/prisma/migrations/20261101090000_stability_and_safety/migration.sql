-- AlterEnum
ALTER TYPE "AuthTokenPurpose" ADD VALUE 'LOGIN_TWO_FACTOR';

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "removedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PostMedia" ADD COLUMN     "sensitive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loginLockedUntil" TIMESTAMP(3),
ADD COLUMN     "messagePermission" TEXT NOT NULL DEFAULT 'EVERYONE',
ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Mute" (
    "id" TEXT NOT NULL,
    "muterId" TEXT NOT NULL,
    "mutedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Mute_mutedId_idx" ON "Mute"("mutedId");

-- CreateIndex
CREATE UNIQUE INDEX "Mute_muterId_mutedId_key" ON "Mute"("muterId", "mutedId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "Mute" ADD CONSTRAINT "Mute_muterId_fkey" FOREIGN KEY ("muterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mute" ADD CONSTRAINT "Mute_mutedId_fkey" FOREIGN KEY ("mutedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

