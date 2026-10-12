-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "reelEligible" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PostMedia" ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "width" INTEGER,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "durationMs" INTEGER,
ADD COLUMN     "sizeBytes" INTEGER;

-- CreateTable
CREATE TABLE "ContentInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "mediaId" TEXT,
    "eventType" TEXT NOT NULL,
    "watchMs" INTEGER,
    "durationMs" INTEGER,
    "surface" TEXT NOT NULL,
    "requestId" TEXT,
    "position" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentInteraction_userId_createdAt_idx" ON "ContentInteraction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentInteraction_postId_createdAt_idx" ON "ContentInteraction"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "Post_reelEligible_createdAt_idx" ON "Post"("reelEligible", "createdAt");

-- AddForeignKey
ALTER TABLE "ContentInteraction" ADD CONSTRAINT "ContentInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentInteraction" ADD CONSTRAINT "ContentInteraction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
