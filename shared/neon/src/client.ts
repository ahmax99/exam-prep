import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { WebSocket } from 'ws'

import { PrismaClient } from '../prisma/generated/client.js'

neonConfig.webSocketConstructor = WebSocket
neonConfig.poolQueryViaFetch = true

declare global {
  var prisma: PrismaClient | undefined
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const createPrismaClient = () => {
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL)
    throw new Error(
      'DATABASE_URL is required. Ensure secrets are loaded before accessing the database.'
    )

  const adapter = new PrismaNeon({ connectionString: DATABASE_URL })
  return new PrismaClient({ adapter })
}

// Lazy initialization
const getPrismaClient = () => {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createPrismaClient()

  return globalForPrisma.prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get: (_, prop) => {
    const client = getPrismaClient()
    return client[prop as keyof PrismaClient]
  }
})
