import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { WebSocket } from 'ws'

import { env } from '@/config/env'

import { PrismaClient } from '../../prisma/generated/client'

export * from '../../prisma/generated/client'

neonConfig.webSocketConstructor = WebSocket
neonConfig.poolQueryViaFetch = true

declare global {
  var prismaPromise: Promise<PrismaClient> | undefined
}

const globalForPrisma = globalThis as unknown as {
  prismaPromise: Promise<PrismaClient> | undefined
}

const createPrismaClient = async () =>
  new PrismaClient({
    adapter: new PrismaNeon({ connectionString: env.DATABASE_URL })
  })

export const getPrismaClient = (): Promise<PrismaClient> => {
  if (!globalForPrisma.prismaPromise)
    globalForPrisma.prismaPromise = createPrismaClient().catch(
      (error: unknown) => {
        globalForPrisma.prismaPromise = undefined
        throw error
      }
    )

  return globalForPrisma.prismaPromise
}
