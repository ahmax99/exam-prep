import pino from 'pino'

import { env } from '@/config/env'

export const logger = pino({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:HH:MM:ss'
      }
    }
  }),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-id-token"]',
      '*.password',
      '*.token',
      '*.secret',
      '*.idToken',
      '*.accessToken',
      '*.refreshToken',
      '*.id_token',
      '*.access_token',
      '*.refresh_token'
    ],
    censor: '[REDACTED]'
  }
})
