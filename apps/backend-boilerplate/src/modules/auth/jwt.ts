import { createRemoteJWKSet, jwtVerify } from 'jose'

import {
  COGNITO_AUDIENCE,
  COGNITO_ISSUER,
  COGNITO_JWKS_URI
} from '@/constants/index.js'
import { catchAsyncError } from '@/error/utils/catchError.js'

const JWKS = createRemoteJWKSet(new URL(COGNITO_JWKS_URI))

export const verifyToken = (token: string) =>
  catchAsyncError(
    jwtVerify(token, JWKS, {
      issuer: COGNITO_ISSUER,
      audience: COGNITO_AUDIENCE
    }).then(({ payload }) => payload)
  )
