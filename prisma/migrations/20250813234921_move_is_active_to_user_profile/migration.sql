/*
  Warnings:

  - You are about to drop the column `expires_at` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `nickname` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `preferred_game_id` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `user_profiles` DROP FOREIGN KEY `user_profiles_preferred_game_id_fkey`;

-- DropIndex
DROP INDEX `user_profiles_preferred_game_id_fkey` ON `user_profiles`;

-- AlterTable
ALTER TABLE `user_profiles` DROP COLUMN `expires_at`,
    DROP COLUMN `nickname`,
    DROP COLUMN `preferred_game_id`,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `is_active`;
