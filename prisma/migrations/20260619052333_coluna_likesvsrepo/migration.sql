/*
  Warnings:

  - Added the required column `likes_vs_repo` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "likes_vs_repo" BOOLEAN NOT NULL;
