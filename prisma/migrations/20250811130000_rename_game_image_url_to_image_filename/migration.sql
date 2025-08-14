-- Rename column image_url -> image_filename in games
ALTER TABLE `games`
  CHANGE COLUMN `image_url` `image_filename` VARCHAR(255) NULL;


