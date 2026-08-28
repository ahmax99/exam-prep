import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'
import { helmet } from 'elysia-helmet'

import { env } from '@/config/env.js'
import { logger, loggerPlugin } from '@/config/logger.js'
import { loadSecrets } from '@/config/secrets.js'
import { routes } from '@/routes/index.js'

await loadSecrets()

const app = new Elysia()
  .use(loggerPlugin)
  .use(helmet())
  .use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true
    })
  )
  .get('/', () => ({
    message: 'Backend Boilerplate API',
    version: '1.0.0',
    documentation: '/api/v1/openapi',
    endpoints: {
      posts: '/api/v1/posts',
      comments: '/api/v1/comments'
    }
  }))
  .use(routes)
  .listen(env.BACKEND_PORT)

logger.info(`🚀 Server running on port ${env.BACKEND_PORT}`)

export default app
