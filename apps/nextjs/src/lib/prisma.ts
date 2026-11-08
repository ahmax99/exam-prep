import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { WebSocket } from 'ws'

import { env } from '@/config/env'

import { PrismaClient } from '../../prisma/generated/client'

export * from '../../prisma/generated/client'

neonConfig.webSocketConstructor = WebSocket
neonConfig.poolQueryViaFetch = true

// Reused across dev hot reloads so each reload doesn't open a new pool.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaNeon({ connectionString: env.DATABASE_URL })
  })

globalForPrisma.prisma = prisma
