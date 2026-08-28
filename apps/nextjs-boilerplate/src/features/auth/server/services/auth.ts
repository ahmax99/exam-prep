'use server'

import { authorizationCodeGrant, buildAuthorizationUrl } from 'openid-client'

import { env } from '@/config/env'
import { logger } from '@/config/logger'

import { getOIDCClient } from '../../lib/cognitoClient'
import { PUBLIC_ROUTES } from '../../lib/routes'
import type { CallbackParams, PKCEData } from '../../schemas/auth.schema'
import { generateNonce, generatePKCE, generateState } from '../../utils/pkce'
import { safeRelativePath } from '../../utils/redirect'
import { createUser } from '../api'

import { assignDefaultRoleGroup } from './role'
import {
  destroyPKCESession,
  destroySession,
  getPKCEData,
  setPKCEData,
  setSessionData
} from './session'

const log = logger.child({ module: 'auth' })

const SESSION_CHECKS = [
  {
    check: (pkce: PKCEData, state: CallbackParams['state']) =>
      pkce.state !== state,
    message: 'OAuth state mismatch',
    error: 'invalid_state'
  },
  {
    check: (pkce: PKCEData) => !pkce.codeVerifier,
    message: 'OAuth code verifier missing from session',
    error: 'missing_verifier'
  },
  {
    check: (pkce: PKCEData) => !pkce.nonce,
    message: 'OAuth nonce missing from session',
    error: 'missing_nonce'
  }
]

const getValidTokenData = (
  tokens: Awaited<ReturnType<typeof authorizationCodeGrant>>
) => {
  const claims = tokens.claims()
  if (!claims || !tokens.id_token) return null

  return { claims, idToken: tokens.id_token }
}

export const handleLogin = async (callbackUrl?: string) => {
  const { codeVerifier, codeChallenge } = await generatePKCE()
  const state = generateState()
  const nonce = generateNonce()

  await setPKCEData({
    codeVerifier,
    state,
    nonce,
    callbackUrl: safeRelativePath(callbackUrl) ?? PUBLIC_ROUTES.HOME
  })

  const config = await getOIDCClient()

  const parameters = {
    redirect_uri: `${env.BASE_URL}/api/auth/callback`,
    scope: 'openid email profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    nonce
  }

  const authUrl = buildAuthorizationUrl(config, parameters)

  log.info({ callbackUrl }, 'Login initiated')

  return { authUrl: authUrl.toString() }
}

const validateCallbackParams = (params: CallbackParams) => {
  const { code, state, error } = params

  if (error) {
    log.warn({ error }, 'OAuth callback returned error')
    return `/auth/login?error=${error}`
  }

  const isMissingParams = !code || !state
  if (isMissingParams) {
    log.warn('OAuth callback missing code or state')
    return '/auth/login?error=missing_code'
  }

  return null
}

const validateSession = (pkce: PKCEData, state: CallbackParams['state']) => {
  const failed = SESSION_CHECKS.find(({ check }) => check(pkce, state))
  if (failed) {
    log.warn(failed.message)
    return `/auth/login?error=${failed.error}`
  }
  return null
}

export const handleCallback = async (
  currentUrl: URL,
  params: CallbackParams
) => {
  const paramError = validateCallbackParams(params)
  if (paramError) return { redirectUrl: paramError }

  const [pkce, config] = await Promise.all([getPKCEData(), getOIDCClient()])

  const sessionError = validateSession(pkce, params.state)
  if (sessionError) return { redirectUrl: sessionError }

  const tokens = await authorizationCodeGrant(config, currentUrl, {
    pkceCodeVerifier: pkce.codeVerifier,
    expectedState: params.state,
    expectedNonce: pkce.nonce
  })

  const tokenData = getValidTokenData(tokens)
  if (!tokenData) {
    log.warn('OAuth token exchange returned invalid claims or missing id_token')
    return { redirectUrl: '/auth/login?error=invalid_token' }
  }

  const { claims, idToken } = tokenData
  const email = claims.email as string

  // establish the real session before dropping the transient PKCE cookie
  await setSessionData({ refreshToken: tokens.refresh_token })
  await destroyPKCESession()

  await Promise.all([
    // idempotent - returns existing user if already created
    createUser(
      { cognitoSub: claims.sub, email, name: claims.name as string },
      idToken
    ),
    // assign user to default "Users" group on first login
    assignDefaultRoleGroup(claims.sub)
  ])

  log.info({ userId: claims.sub }, 'User authenticated successfully')

  return { redirectUrl: pkce.callbackUrl ?? PUBLIC_ROUTES.HOME }
}

export const handleLogout = async () => {
  await Promise.all([destroySession(), destroyPKCESession()])

  log.info('User logged out')

  const logoutUrl = new URL(
    `https://${env.COGNITO_DOMAIN}.auth.${env.AWS_REGION}.amazoncognito.com/logout`
  )

  logoutUrl.searchParams.set('client_id', env.COGNITO_CLIENT_ID)
  logoutUrl.searchParams.set('logout_uri', env.BASE_URL)

  return { logoutUrl: logoutUrl.toString() }
}
