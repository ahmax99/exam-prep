import { type Configuration, discovery } from 'openid-client'

import { env } from '@/config/env'

let cachedConfig: Configuration | null = null

export const getOIDCClient = async () => {
  if (cachedConfig) return cachedConfig

  const issuerUrl = new URL(
    `https://cognito-idp.${env.AWS_REGION}.amazonaws.com/${env.COGNITO_USERPOOL_ID}`
  )

  cachedConfig = await discovery(issuerUrl, env.COGNITO_CLIENT_ID)

  return cachedConfig
}
