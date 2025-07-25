-- AlterTable
ALTER TABLE `users` ADD COLUMN `reset_token_used` BOOLEAN NOT NULL DEFAULT false;
