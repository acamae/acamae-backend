-- Migration: Add reset_token_used column
-- This migration adds a boolean column to track if a reset token has been used

ALTER TABLE `users` ADD COLUMN `reset_token_used` BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for efficient queries on active reset tokens
CREATE INDEX `idx_users_reset_token_active` ON `users`(`reset_token`)
WHERE `reset_token` IS NOT NULL AND `reset_token_used` = FALSE;

-- Update any existing reset tokens to not be marked as used (safe default)
UPDATE `users` SET `reset_token_used` = FALSE WHERE `reset_token` IS NOT NULL;
