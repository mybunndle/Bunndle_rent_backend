import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function connectPrisma() {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected to MongoDB successfully');
  } catch (err) {
    console.error('❌ Prisma failed to connect:', err.message);
    process.exit(1);
  }
}

export default prisma;