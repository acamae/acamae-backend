import { createRequire } from 'module';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import isoCountries from 'i18n-iso-countries';

const require = createRequire(import.meta.url);
const enLocale = require('i18n-iso-countries/langs/en.json');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');
  // Catálogo de países (idempotente) desde ISO 3166-1 (i18n-iso-countries)
  try {
    isoCountries.registerLocale(enLocale);
    const codes = Object.keys(isoCountries.getAlpha2Codes());
    const namesOfficial = isoCountries.getNames('en', { select: 'official' });
    const namesCommon = isoCountries.getNames('en');
    const entries = codes
      .map((code) => {
        const upper = code.toUpperCase();
        const name =
          namesOfficial[upper] ||
          namesOfficial[code] ||
          namesCommon[upper] ||
          namesCommon[code] ||
          null;
        return name ? { code: upper, name } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));

    // Ensure exact ISO set: remove any non-ISO codes present
    const validCodes = entries.map((e) => e.code);
    await prisma.country.deleteMany({ where: { NOT: { code: { in: validCodes } } } });

    for (const c of entries) {
      await prisma.country.upsert({
        where: { code: c.code },
        update: { name: c.name },
        create: { code: c.code, name: c.name },
      });
    }
    console.log(`   - Países: ${entries.length} registros (ISO 3166-1)`);
  } catch (err) {
    console.warn('⚠️  No se pudo poblar el catálogo de países desde ISO 3166-1:', err.message);
  }
  // Catálogo de juegos (idempotente)
  const games = [
    {
      name_code: 'user-profile.games.list.bf.title',
      code: 'bf',
      image_filename: 'bf-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.cod.title',
      code: 'cod',
      image_filename: 'cod-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.csgo.title',
      code: 'csgo',
      image_filename: 'csgo-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.dota.title',
      code: 'dota',
      image_filename: 'dota-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.fc.title',
      code: 'fc',
      image_filename: 'fc-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.fortnite.title',
      code: 'fortnite',
      image_filename: 'fortnite-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.gta.title',
      code: 'gta',
      image_filename: 'gta-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.lol.title',
      code: 'lol',
      image_filename: 'lol-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.minecraft.title',
      code: 'minecraft',
      image_filename: 'minecraft-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.overwatch.title',
      code: 'overwatch',
      image_filename: 'overwatch-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.pubg.title',
      code: 'pubg',
      image_filename: 'pubg-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.roblox.title',
      code: 'roblox',
      image_filename: 'roblox-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.rocketleague.title',
      code: 'rocketleague',
      image_filename: 'rocketleague-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.rust.title',
      code: 'rust',
      image_filename: 'rust-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.tft.title',
      code: 'tft',
      image_filename: 'tft-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.valorant.title',
      code: 'valorant',
      image_filename: 'valorant-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.wow.title',
      code: 'wow',
      image_filename: 'wow-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.poe.title',
      code: 'poe',
      image_filename: 'poe-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.marvelrivals.title',
      code: 'marvelrivals',
      image_filename: 'marvelrivals-icon-500.png',
    },
    {
      name_code: 'user-profile.games.list.projectzomboid.title',
      code: 'projectzomboid',
      image_filename: 'projectzomboid-icon-500.png',
    },
  ];

  for (const g of games) {
    await prisma.game.upsert({
      where: { code: g.code },
      update: { name_code: g.name_code, image_filename: g.image_filename },
      create: { code: g.code, name_code: g.name_code, image_filename: g.image_filename },
    });
  }

  // Crear usuarios de ejemplo
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Usuario administrador
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@acamae.com' },
    update: {},
    create: {
      email: 'admin@acamae.com',
      password_hash: hashedPassword,
      first_name: 'Administrador',
      last_name: 'Sistema',
      role: 'admin',
      is_verified: true,
      username: 'Admin',
      verification_token: null,
      verification_expires_at: null,
      reset_token: null,
      reset_expires_at: null,
      reset_token_used: false,
    },
  });

  // Usuario manager
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@acamae.com' },
    update: {},
    create: {
      email: 'manager@acamae.com',
      password_hash: hashedPassword,
      first_name: 'Manager',
      last_name: 'Equipo',
      role: 'manager',
      is_verified: true,
      username: 'Manager',
      verification_token: null,
      verification_expires_at: null,
      reset_token: null,
      reset_expires_at: null,
      reset_token_used: false,
    },
  });

  // Usuario jugador
  const playerUser = await prisma.user.upsert({
    where: { email: 'player@acamae.com' },
    update: {},
    create: {
      email: 'player@acamae.com',
      password_hash: hashedPassword,
      first_name: 'Jugador',
      last_name: 'Ejemplo',
      role: 'user',
      is_verified: true,
      username: 'Player',
      verification_token: null,
      verification_expires_at: null,
      reset_token: null,
      reset_expires_at: null,
      reset_token_used: false,
    },
  });

  // Ensure user profiles exist and start inactive
  for (const u of [adminUser, managerUser, playerUser]) {
    await prisma.userProfile.upsert({
      where: { user_id: u.id },
      update: { is_active: false },
      create: { user_id: u.id, is_active: false },
    });
  }

  // Crear equipos de ejemplo
  const team1 = await prisma.team.upsert({
    where: { tag: 'ALPH' },
    update: {},
    create: {
      name: 'Equipo Alpha',
      tag: 'ALPH',
      description: 'Equipo profesional de esports',
      logo_filename: 'https://via.placeholder.com/150x150/007bff/ffffff?text=Alpha',
      userId: managerUser.id,
    },
  });

  const team2 = await prisma.team.upsert({
    where: { tag: 'BETA' },
    update: {},
    create: {
      name: 'Equipo Beta',
      tag: 'BETA',
      description: 'Equipo amateur de esports',
      logo_filename: 'https://via.placeholder.com/150x150/28a745/ffffff?text=Beta',
      userId: managerUser.id,
    },
  });

  // Nota: La relación Team -> User es de propiedad (Team.userId). No asignamos teamId al usuario.

  console.log('✅ Seed completado exitosamente!');
  console.log('');
  console.log('📊 Datos creados:');
  console.log(`   - Usuario Admin: admin@acamae.com / password123`);
  console.log(`   - Usuario Manager: manager@acamae.com / password123`);
  console.log(`   - Usuario Player: player@acamae.com / password123`);
  console.log(`   - Equipos: ${team1.name}, ${team2.name}`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
