/*
  Warnings:

  - You are about to drop the column `user_id` on the `game_profiles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[profile_id,game_id]` on the table `game_profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profile_id` to the `game_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `game_profiles` DROP FOREIGN KEY `game_profiles_user_id_fkey`;

-- DropIndex
DROP INDEX `game_profiles_user_id_game_id_key` ON `game_profiles`;

-- 1) Add nullable profile_id
ALTER TABLE `game_profiles` ADD COLUMN `profile_id` INTEGER UNSIGNED NULL;

-- 2) Backfill profile_id from existing user_id
UPDATE `game_profiles` gp
JOIN `user_profiles` up ON up.user_id = gp.user_id
SET gp.profile_id = up.id
WHERE gp.profile_id IS NULL;

-- 3) Make profile_id NOT NULL after backfill
ALTER TABLE `game_profiles` MODIFY COLUMN `profile_id` INTEGER UNSIGNED NOT NULL;

-- 4) Drop old foreign key and user_id column
ALTER TABLE `game_profiles` DROP COLUMN `user_id`;

-- CreateIndex
CREATE UNIQUE INDEX `game_profiles_profile_id_game_id_key` ON `game_profiles`(`profile_id`, `game_id`);

-- AddForeignKey
ALTER TABLE `game_profiles` ADD CONSTRAINT `game_profiles_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `user_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `game_profiles` CHANGE `profile_id` `profile_id` INT(10) UNSIGNED NOT NULL AFTER `game_id`;
