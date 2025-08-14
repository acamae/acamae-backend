-- Seed or upsert games catalog entries
-- This migration ensures the catalog exists/updates across all environments

INSERT INTO `games` (`code`, `name_code`, `image_url`, `created_at`, `updated_at`)
VALUES
  ('bf', 'user-profile.games.list.bf.title', 'bf-icon-500.png', NOW(), NOW()),
  ('cod', 'user-profile.games.list.cod.title', 'cod-icon-500.png', NOW(), NOW()),
  ('csgo', 'user-profile.games.list.csgo.title', 'csgo-icon-500.png', NOW(), NOW()),
  ('dota', 'user-profile.games.list.dota.title', 'dota-icon-500.png', NOW(), NOW()),
  ('fc', 'user-profile.games.list.fc.title', 'fc-icon-500.png', NOW(), NOW()),
  ('fortnite', 'user-profile.games.list.fortnite.title', 'fortnite-icon-500.png', NOW(), NOW()),
  ('gta', 'user-profile.games.list.gta.title', 'gta-icon-500.png', NOW(), NOW()),
  ('lol', 'user-profile.games.list.lol.title', 'lol-icon-500.png', NOW(), NOW()),
  ('minecraft', 'user-profile.games.list.minecraft.title', 'minecraft-icon-500.png', NOW(), NOW()),
  ('overwatch', 'user-profile.games.list.overwatch.title', 'overwatch-icon-500.png', NOW(), NOW()),
  ('pubg', 'user-profile.games.list.pubg.title', 'pubg-icon-500.png', NOW(), NOW()),
  ('roblox', 'user-profile.games.list.roblox.title', 'roblox-icon-500.png', NOW(), NOW()),
  ('rocketleague', 'user-profile.games.list.rocketleague.title', 'rocketleague-icon-500.png', NOW(), NOW()),
  ('rust', 'user-profile.games.list.rust.title', 'rust-icon-500.png', NOW(), NOW()),
  ('tft', 'user-profile.games.list.tft.title', 'tft-icon-500.png', NOW(), NOW()),
  ('valorant', 'user-profile.games.list.valorant.title', 'valorant-icon-500.png', NOW(), NOW()),
  ('wow', 'user-profile.games.list.wow.title', 'wow-icon-500.png', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `name_code` = VALUES(`name_code`),
  `image_url` = VALUES(`image_url`),
  `updated_at` = VALUES(`updated_at`);


