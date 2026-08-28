import { bearer } from '@elysia/bearer'
import { Elysia, status } from 'elysia'
import type { JWTPayload } from 'jose'

import { errorHandler } from '@/error/lib/errorHandler.js'
import { verifyToken } from '@/modules/auth/jwt.js'

export interface AuthUser {
  cognitoSub: string
  email: string
  role: string[]
  payload: JWTPayload
}

export const authPlugin = new Elysia({ name: 'auth' })
  .use(errorHandler)
  .use(bearer())
  .macro({
    auth: {
      async resolve({ bearer, set, headers }) {
        // SSR calls hit the Lambda Function URL with SigV4 IAM auth, which
        // takes the Authorization header for the AWS signature. They send the
        // Cognito ID token in X-Id-Token instead.
        const token = bearer ?? headers['x-id-token']

        if (!token) {
          set.headers['WWW-Authenticate'] = 'Bearer realm="api"'
          return status(401, { error: { message: 'Authentication required' } })
        }

        const result = await verifyToken(token)

        if (result.isErr())
          return status(401, { error: { message: 'Invalid or expired token' } })

        const payload = result.value

        return {
          user: {
            cognitoSub: payload.sub,
            email: payload.email,
            role: payload['cognito:groups'],
            payload
          } as AuthUser
        }
      }
    }
  })
