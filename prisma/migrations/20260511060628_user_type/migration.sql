/*
  Warnings:

  - Added the required column `userType` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "USER_TYPE" AS ENUM ('ADMIN', 'COMMON');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "userType" "USER_TYPE" NOT NULL;
