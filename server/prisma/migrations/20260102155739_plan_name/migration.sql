/*
  Warnings:

  - The values [BASIC,PLATINUM] on the enum `RoomPlanType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RoomPlanType_new" AS ENUM ('DEFAULT', 'GOLD', 'PLATINIUM');
ALTER TABLE "RoomPlan" ALTER COLUMN "name" TYPE "RoomPlanType_new" USING ("name"::text::"RoomPlanType_new");
ALTER TYPE "RoomPlanType" RENAME TO "RoomPlanType_old";
ALTER TYPE "RoomPlanType_new" RENAME TO "RoomPlanType";
DROP TYPE "public"."RoomPlanType_old";
COMMIT;
