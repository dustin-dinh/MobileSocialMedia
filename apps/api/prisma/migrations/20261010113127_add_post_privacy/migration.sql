-- CreateEnum
CREATE TYPE "PostPrivacy" AS ENUM ('PUBLIC', 'FRIENDS', 'PRIVATE');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "privacy" "PostPrivacy" NOT NULL DEFAULT 'PUBLIC';
