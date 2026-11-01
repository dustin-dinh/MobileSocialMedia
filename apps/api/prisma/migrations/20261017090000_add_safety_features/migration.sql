-- Safety batch (2026-10-17): 18+ birth date, message requests, anonymous conversations,
-- sensitive chat images, story reactions, report snapshots. Additive, plus one swapped
-- unique index on Conversation (a pair may now have a direct and an anonymous conversation).

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ageLockedAt" TIMESTAMP(3),
ADD COLUMN     "allowAnonymousMessages" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "anonymousSuspendedAt" TIMESTAMP(3),
ADD COLUMN     "birthDate" DATE;

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'DIRECT',
ADD COLUMN     "requesterId" TEXT,
ADD COLUMN     "revealedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACCEPTED';

-- New unique index first, old one dropped after: every existing row is 'DIRECT', so the
-- pair stays unique throughout.
CREATE UNIQUE INDEX "Conversation_userAId_userBId_kind_key" ON "Conversation"("userAId", "userBId", "kind");
DROP INDEX "Conversation_userAId_userBId_key";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "sensitive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "storyId" TEXT;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "snapshot" JSONB;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "allowAnonymous" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "StoryReaction" (
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryReaction_pkey" PRIMARY KEY ("storyId","userId")
);

-- CreateIndex
CREATE INDEX "StoryReaction_storyId_createdAt_idx" ON "StoryReaction"("storyId", "createdAt");

-- AddForeignKey
ALTER TABLE "StoryReaction" ADD CONSTRAINT "StoryReaction_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryReaction" ADD CONSTRAINT "StoryReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
