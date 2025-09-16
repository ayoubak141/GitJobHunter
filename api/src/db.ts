import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg-worker'

// Create Prisma client with PostgreSQL for Cloudflare Workers
export default function getPrismaClient(env: any) {
  const connectionString = env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  // Create a new client for each request to prevent connection hanging
  // This ensures clean state between requests in Cloudflare Workers
  const adapter = new PrismaPg({ 
    connectionString
  });
  
  const prisma = new PrismaClient({
    adapter,
    transactionOptions: {
      isolationLevel: "Serializable", 
      maxWait: 5000,
      timeout: 10000,
    },
  });

  return prisma;
}