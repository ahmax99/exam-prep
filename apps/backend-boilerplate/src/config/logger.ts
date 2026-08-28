import { createPinoLogger } from '@bogeychan/elysia-logger'

import { env } from '@/config/env.js'

export const logger = createPinoLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname'
      }
    }
  }),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      '*.password',
      '*.token',
      '*.secret'
    ],
    censor: '[REDACTED]'
  }
})

export const loggerPlugin = () =>
  logger.into({
    autoLogging: {
      ignore: (ctx) =>
        env.NODE_ENV === 'production' &&
        (ctx.path === '/' || ctx.path === '/health')
    },
    customProps: (ctx) => {
      if ('user' in ctx && ctx.user)
        return { userId: (ctx.user as { cognitoSub?: string }).cognitoSub }

      return {}
    }
  })
