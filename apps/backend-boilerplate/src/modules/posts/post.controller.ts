import { fromTypes, openapi } from '@elysiajs/openapi'
import { PostModel } from '@shared/config'
import { Elysia } from 'elysia'

import { errorHandler } from '@/error/lib/errorHandler.js'
import { handleApiError } from '@/error/utils/handleApiError.js'
import { authPlugin } from '@/modules/auth/auth.plugin.js'
import { getUserPermissions } from '@/modules/auth/permission.js'
import { postPlugin } from '@/modules/posts/post.plugin.js'
import { generateSlug } from '@/utils/generateSlug.js'

export const postController = new Elysia({ prefix: '/posts' })
  .use(postPlugin)
  .use(authPlugin)
  .use(errorHandler)
  .use(openapi({ references: fromTypes() }))
  .get(
    '/',
    async ({ postService }) =>
      handleApiError(postService.getAll(getUserPermissions())),
    {
      detail: {
        summary: 'Get all posts',
        description: 'Retrieve a list of all published posts',
        tags: ['Posts']
      }
    }
  )
  .get(
    '/:id',
    async ({ params, postService }) =>
      handleApiError(postService.getById(params.id, getUserPermissions())),
    {
      params: PostModel.postIdParams,
      detail: {
        summary: 'Get post by ID',
        description: 'Retrieve a specific post by its unique identifier',
        tags: ['Posts']
      }
    }
  )
  .get(
    '/presigned-url',
    async ({ request, query, user, uploadService }) =>
      handleApiError(
        uploadService.getPresignedUrl(
          'posts',
          request,
          query.filename,
          query.contentType,
          getUserPermissions(user)
        )
      ),
    {
      query: PostModel.uploadImageQuery,
      auth: true,
      detail: {
        summary: 'Get presigned URL for image upload',
        description: 'Generate a presigned S3 URL for uploading post images',
        tags: ['Posts']
      }
    }
  )
  .post(
    '/',
    async ({ body, user, postService, userService }) => {
      const dbUser = await handleApiError(
        userService.getMe(user.cognitoSub, user.role)
      )

      return handleApiError(
        postService.create(
          {
            ...body,
            slug: body.slug || generateSlug(body.title),
            authorId: dbUser.id
          },
          getUserPermissions(user)
        )
      )
    },
    {
      body: PostModel.createPostBody,
      auth: true,
      detail: {
        summary: 'Create a new post',
        description:
          'Create a new blog post with title, content, and optional image',
        tags: ['Posts']
      }
    }
  )
  .put(
    '/:id',
    async ({ params, body, user, postService }) =>
      handleApiError(
        postService.update(params.id, body, getUserPermissions(user))
      ),
    {
      params: PostModel.postIdParams,
      body: PostModel.updatePostBody,
      auth: true,
      detail: {
        summary: 'Update a post',
        description: 'Update an existing post by ID',
        tags: ['Posts']
      }
    }
  )
  .delete(
    '/:id',
    async ({ params, user, postService }) =>
      handleApiError(postService.delete(params.id, getUserPermissions(user))),
    {
      params: PostModel.postIdParams,
      auth: true,
      detail: {
        summary: 'Delete a post',
        description: 'Soft delete a post by ID (sets deletedAt timestamp)',
        tags: ['Posts']
      }
    }
  )
