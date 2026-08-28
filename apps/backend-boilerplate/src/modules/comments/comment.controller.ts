import { fromTypes, openapi } from '@elysiajs/openapi'
import { CommentModel } from '@shared/config'
import { Elysia } from 'elysia'

import { errorHandler } from '@/error/lib/errorHandler.js'
import { handleApiError } from '@/error/utils/handleApiError.js'
import { authPlugin } from '@/modules/auth/auth.plugin.js'
import { getUserPermissions } from '@/modules/auth/permission.js'
import { commentPlugin } from '@/modules/comments/comment.plugin.js'

export const commentController = new Elysia({ prefix: '/comments' })
  .use(commentPlugin)
  .use(authPlugin)
  .use(errorHandler)
  .use(openapi({ references: fromTypes() }))
  .get(
    '/',
    async ({ query, commentService }) =>
      handleApiError(commentService.getAll(query.postId, getUserPermissions())),
    {
      query: CommentModel.createCommentBody.pick({ postId: true }),
      detail: {
        summary: 'Get comments for a post',
        description: 'Retrieve all comments for a specific post by postId',
        tags: ['Comments']
      }
    }
  )
  .post(
    '/',
    async ({ body, user, commentService, userService }) => {
      const dbUser = await handleApiError(
        userService.getMe(user.cognitoSub, user.role)
      )

      return handleApiError(
        commentService.create(
          {
            ...body,
            authorId: dbUser.id
          },
          getUserPermissions(user, dbUser.id)
        )
      )
    },
    {
      body: CommentModel.createCommentBody.omit({ authorId: true }),
      auth: true,
      detail: {
        summary: 'Create a new comment',
        description: 'Add a new comment to a post',
        tags: ['Comments']
      }
    }
  )
  .delete(
    '/:id',
    async ({ params, user, commentService, userService }) => {
      const dbUser = await handleApiError(
        userService.getMe(user.cognitoSub, user.role)
      )

      return handleApiError(
        commentService.delete(params.id, getUserPermissions(user, dbUser.id))
      )
    },
    {
      params: CommentModel.commentIdParams,
      auth: true,
      detail: {
        summary: 'Delete a comment',
        description: 'Soft delete a comment by ID (sets deletedAt timestamp)',
        tags: ['Comments']
      }
    }
  )
