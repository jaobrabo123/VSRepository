-- DropForeignKey
ALTER TABLE "admin" DROP CONSTRAINT "admin_user_id_fkey";

-- DropForeignKey
ALTER TABLE "common_user_profile" DROP CONSTRAINT "common_user_profile_user_id_fkey";

-- DropForeignKey
ALTER TABLE "post" DROP CONSTRAINT "post_common_user_id_fkey";

-- AddForeignKey
ALTER TABLE "common_user_profile" ADD CONSTRAINT "common_user_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin" ADD CONSTRAINT "admin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post" ADD CONSTRAINT "post_common_user_id_fkey" FOREIGN KEY ("common_user_id") REFERENCES "common_user_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
