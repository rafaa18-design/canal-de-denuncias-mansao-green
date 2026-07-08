import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 usa driver adapters: o client recebe um adapter Postgres (pg).
// Singleton para evitar múltiplas conexões em dev (hot reload).
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function criarPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? criarPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
