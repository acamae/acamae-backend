const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear usuarios de ejemplo
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Usuario administrador
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@acamae.com' },
    update: {},
    create: {
      email: 'admin@acamae.com',
      password: hashedPassword,
      firstName: 'Administrador',
      lastName: 'Sistema',
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
    },
  });

  // Usuario manager
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@acamae.com' },
    update: {},
    create: {
      email: 'manager@acamae.com',
      password: hashedPassword,
      firstName: 'Manager',
      lastName: 'Equipo',
      role: 'MANAGER',
      isVerified: true,
      isActive: true,
    },
  });

  // Usuario jugador
  const playerUser = await prisma.user.upsert({
    where: { email: 'player@acamae.com' },
    update: {},
    create: {
      email: 'player@acamae.com',
      password: hashedPassword,
      firstName: 'Jugador',
      lastName: 'Ejemplo',
      role: 'PLAYER',
      isVerified: true,
      isActive: true,
    },
  });

  // Crear equipos de ejemplo
  const team1 = await prisma.team.upsert({
    where: { name: 'Equipo Alpha' },
    update: {},
    create: {
      name: 'Equipo Alpha',
      description: 'Equipo profesional de esports',
      logo: 'https://via.placeholder.com/150x150/007bff/ffffff?text=Alpha',
      isActive: true,
      managerId: managerUser.id,
    },
  });

  const team2 = await prisma.team.upsert({
    where: { name: 'Equipo Beta' },
    update: {},
    create: {
      name: 'Equipo Beta',
      description: 'Equipo amateur de esports',
      logo: 'https://via.placeholder.com/150x150/28a745/ffffff?text=Beta',
      isActive: true,
      managerId: managerUser.id,
    },
  });

  // Asignar jugador al equipo
  await prisma.user.update({
    where: { id: playerUser.id },
    data: {
      teamId: team1.id,
    },
  });

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
