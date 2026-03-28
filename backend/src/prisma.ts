/**
 * Cliente Prisma singleton.
 *
 * Por que um único instance no módulo?
 * - Em desenvolvimento com hot-reload, múltiplos PrismaClient geram muitas conexões ao Postgres.
 * - O padrão da documentação oficial é reutilizar uma instância global em ambientes não serverless.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
