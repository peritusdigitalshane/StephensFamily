const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: 'shane@shanes.com.au' },
  });

  if (!existing) {
    const hashedPassword = await bcrypt.hash('Coopermaxwill21!', 12);
    await prisma.user.create({
      data: {
        email: 'shane@shanes.com.au',
        name: 'Shane',
        password: hashedPassword,
        role: 'superadmin',
        approved: true,
        color: '#2563eb',
        avatar: 'S',
      },
    });
    console.log('SuperAdmin account created: shane@shanes.com.au');
  } else {
    console.log('SuperAdmin account already exists');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
