/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Room` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[apiKey]` on the table `Room` will be added. If there are existing duplicate values, this will fail.
  - The required column `apiKey` was added to the `Room` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `logicConfig` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uiSettings` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'GIF', 'SYSTEM');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "attachmentUrl" TEXT,
ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "allowedDomains" TEXT[],
ADD COLUMN     "apiKey" TEXT NOT NULL,
ADD COLUMN     "logicConfig" JSONB NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "uiSettings" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "RoomPlan" ADD COLUMN     "features" JSONB;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "isGuest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Room_slug_key" ON "Room"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Room_apiKey_key" ON "Room"("apiKey");
