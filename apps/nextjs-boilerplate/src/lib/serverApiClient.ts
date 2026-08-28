import 'server-only'
import ky from 'ky'

import { env } from '@/config/env'
import { logger } from '@/config/logger'
import { getTokens } from '@/features/auth/server/services/token'
import { AppError } from '@/features/error/lib/AppError'
import { logAfterResponse, logBeforeRequest } from '@/lib/requestLogging'

import { signingHook } from './sig4'

// SigV4 (when calling Lambda Function URL with AWS_IAM auth) takes the
// `Authorization` header for itself, so we send the Cognito ID token in a
// custom header. The backend reads it from `Authorization` (Bearer) first and
// falls back to this header for SSR-originated calls.
export const ID_TOKEN_HEADER = 'X-Id-Token'

const isProduction = env.NODE_ENV === 'production'

const log = logger.child({ module: 'backend-client' })

const baseConfig = {
  prefix: env.BACKEND_INTERNAL_URL,
  timeout: 10000,
  credentials: 'include' as const,
  cache: 'no-store' as const,
  retry: {
    limit: 3,
    methods: ['get'],
    statusCodes: [408, 429, 500, 502, 503, 504],
    backoffLimit: 5000
  }
}

export const serverApiClient = ky.create({
  ...baseConfig,
  hooks: {
    beforeRequest: [
      logBeforeRequest(log),
      ...(isProduction ? [signingHook] : [])
    ],
    afterResponse: [logAfterResponse(log)]
  }
})

// signingHook returns a new Request, which makes ky break out of its
// beforeRequest loop. ky.extend() appends hooks AFTER the parent's, so any
// auth-token hook added via extend would never run. We instead create a
// fresh client (not extended) and put the ID-token hook BEFORE signingHook.
export const serverAuthApiClient = ky.create({
  ...baseConfig,
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        const { idToken } = await getTokens()

        if (!idToken) throw new AppError('UNAUTHORIZED')

        request.headers.set(ID_TOKEN_HEADER, idToken)
      },
      logBeforeRequest(log),
      ...(isProduction ? [signingHook] : [])
    ],
    afterResponse: [
      logAfterResponse(log),
      ({ response }) => {
        if (response.status === 401) throw new AppError('UNAUTHORIZED')
      }
    ]
  }
})
