import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'

import { commentController } from '@/modules/comments/comment.controller.js'
import { imageController } from '@/modules/images/image.controller.js'
import { postController } from '@/modules/posts/post.controller.js'
import { userController } from '@/modules/users/user.controller.js'

export const routes = new Elysia({ prefix: '/api/v1' })
  .use(
    openapi({
      documentation: {
        info: {
          title: 'Backend Boilerplate API',
          version: '1.0.0',
          description: 'RESTful API for managing posts and comments'
        },
        tags: [
          { name: 'Posts', description: 'Post management endpoints' },
          { name: 'Comments', description: 'Comment management endpoints' },
          { name: 'Users', description: 'User management endpoints' },
          { name: 'Images', description: 'Image proxy endpoints' }
        ]
      }
    })
  )
  .use(imageController)
  .use(postController)
  .use(commentController)
  .use(userController)
