import { fromTypes, openapi } from '@elysiajs/openapi'
import { PostModel, UserModel } from '@shared/config'
import { Elysia } from 'elysia'

import { errorHandler } from '@/error/lib/errorHandler.js'
import { handleApiError } from '@/error/utils/handleApiError.js'
import { authPlugin } from '@/modules/auth/auth.plugin.js'
import { getUserPermissions } from '@/modules/auth/permission.js'
import { userPlugin } from '@/modules/users/user.plugin.js'

export const userController = new Elysia({ prefix: '/users' })
  .use(userPlugin)
  .use(authPlugin)
  .use(errorHandler)
  .use(openapi({ references: fromTypes() }))
  .get(
    '/',
    async ({ user, userService }) =>
      handleApiError(userService.getAll(getUserPermissions(user))),
    {
      auth: true,
      detail: {
        summary: 'Get all users',
        description: 'Retrieve a list of all users',
        tags: ['Users']
      }
    }
  )
  .get(
    '/:id',
    async ({ params, user, userService }) =>
      handleApiError(userService.getById(params.id, getUserPermissions(user))),
    {
      params: UserModel.userIdParams,
      auth: true,
      detail: {
        summary: 'Get user by ID',
        description: 'Retrieve a specific user by their unique identifier',
        tags: ['Users']
      }
    }
  )
  .get(
    '/me',
    async ({ user, userService }) =>
      handleApiError(userService.getMe(user.cognitoSub, user.role)),
    {
      auth: true,
      detail: {
        summary: 'Get current user',
        description: 'Retrieve the authenticated user profile',
        tags: ['Users']
      }
    }
  )
  .get(
    '/presigned-url',
    async ({ request, query, user, uploadService }) =>
      handleApiError(
        uploadService.getPresignedUrl(
          'account',
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
        summary: 'Get presigned URL for profile image upload',
        description:
          'Generate a presigned S3 URL for uploading user profile images',
        tags: ['Users']
      }
    }
  )
  .post(
    '/',
    async ({ body, user, userService }) =>
      handleApiError(
        userService.create({
          ...body,
          cognitoSub: user.cognitoSub,
          email: user.email
        })
      ),
    {
      body: UserModel.createUserBody,
      auth: true,
      detail: {
        summary: 'Register a new user',
        description:
          'Register a new user after first-time Cognito signup. CognitoSub and email are extracted from JWT. Idempotent - returns existing user if already registered.',
        tags: ['Users']
      }
    }
  )
  .put(
    '/:id',
    async ({ params, body, user, userService }) =>
      handleApiError(
        userService.update(params.id, body, getUserPermissions(user))
      ),
    {
      params: UserModel.userIdParams,
      body: UserModel.updateUserBody,
      auth: true,
      detail: {
        summary: 'Update a user',
        description: 'Update an existing user by ID',
        tags: ['Users']
      }
    }
  )
  .delete(
    '/:id',
    async ({ params, user, userService }) => {
      const dbUser = await handleApiError(
        userService.getMe(user.cognitoSub, user.role)
      )

      return handleApiError(
        userService.delete(params.id, getUserPermissions(user, dbUser.id))
      )
    },
    {
      params: UserModel.userIdParams,
      auth: true,
      detail: {
        summary: 'Delete a user',
        description: 'Permanently delete a user by ID',
        tags: ['Users']
      }
    }
  )
