-- Add is_active to teams with default true
ALTER TABLE `teams`
  ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT TRUE AFTER `logo_filename`;


