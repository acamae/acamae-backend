-- Rename column profile_image_url -> profile_image_filename in user_profiles
ALTER TABLE `user_profiles`
  CHANGE COLUMN `profile_image_url` `profile_image_filename` VARCHAR(255) NULL;


