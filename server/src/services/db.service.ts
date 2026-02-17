import { PrismaClient } from '@prisma/client';

// Global prisma instance to avoid multiple connections in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create a singleton PrismaClient instance
const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

// In development, store on global to prevent multiple instances during hot reload
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Connect to the database
 * @returns Promise that resolves when connected
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

/**
 * Disconnect from the database
 * @returns Promise that resolves when disconnected
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('Database disconnected');
}

/**
 * Check if the database connection is healthy
 * @returns Promise that resolves to true if healthy
 */
export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export { prisma };
export default prisma;
