import {
  GetSecretValueCommand,
  SecretsManagerClient
} from '@aws-sdk/client-secrets-manager'

const secretsCache: Record<string, string> = {}

const getSecret = async (secretName: string) => {
  if (secretsCache[secretName]) return secretsCache[secretName]

  const client = new SecretsManagerClient()
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  )

  const secretValue =
    response.SecretString ||
    (response.SecretBinary
      ? new TextDecoder('utf-8').decode(response.SecretBinary)
      : null)

  if (!secretValue) throw new Error(`Secret ${secretName} has no value`)

  secretsCache[secretName] = secretValue
  return secretValue
}

export const loadSecrets = async () => {
  if (process.env.NODE_ENV !== 'production') return

  const secretName = process.env.DATABASE_URL_SECRET_NAME
  if (!secretName)
    throw new Error(
      'DATABASE_URL_SECRET_NAME environment variable is required in production'
    )

  const databaseUrl = await getSecret(secretName)
  process.env.DATABASE_URL = databaseUrl
}
