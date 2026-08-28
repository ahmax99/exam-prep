'use server'

import { refreshTokenGrant } from 'openid-client'

import { logger } from '@/config/logger'
import { AppError } from '@/features/error/lib/AppError'

import { getOIDCClient } from '../../lib/cognitoClient'

import { getSession } from './session'

const log = logger.child({ module: 'token' })

export const getTokens = async () => {
  const [session, config] = await Promise.all([getSession(), getOIDCClient()])

  if (!session.refreshToken) {
    log.warn('Token refresh failed: no refresh token')
    throw new AppError('UNAUTHORIZED')
  }

  const tokens = await refreshTokenGrant(config, session.refreshToken)

  return {
    idToken: tokens.id_token,
    accessToken: tokens.access_token
  }
}
