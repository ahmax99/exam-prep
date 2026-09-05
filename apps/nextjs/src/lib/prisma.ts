import {
  SecretsManagerClient,
  GetSecretValueCommand
} from '@aws-sdk/client-secrets-manager'
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

const resolveDatabaseUrl = async (): Promise<string> => {
  if (env.DATABASE_URL) return env.DATABASE_URL

  if (!env.DATABASE_URL_SECRET_NAME)
    throw new Error(
      'DATABASE_URL is required. Ensure secrets are loaded before accessing the database.'
    )

  const client = new SecretsManagerClient({ region: env.AWS_REGION })
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: env.DATABASE_URL_SECRET_NAME })
  )
  if (!response.SecretString)
    throw new Error(
      `Secret "${env.DATABASE_URL_SECRET_NAME}" has no string value.`
    )

  return response.SecretString
}

const createPrismaClient = async () => {
  const DATABASE_URL = await resolveDatabaseUrl()
  const adapter = new PrismaNeon({ connectionString: DATABASE_URL })
  return new PrismaClient({ adapter })
}

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
