/*
  Warnings:

  - The `userId` column on the `Session` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "refreshTokenExpires" TIMESTAMP(3),
DROP COLUMN "userId",
ADD COLUMN     "userId" BIGINT;
