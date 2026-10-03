/*
  Warnings:

  - You are about to drop the column `url` on the `PostMedia` table. All the data in the column will be lost.
  - Added the required column `storagePath` to the `PostMedia` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PostMedia" DROP COLUMN "url",
ADD COLUMN     "storagePath" TEXT NOT NULL;
