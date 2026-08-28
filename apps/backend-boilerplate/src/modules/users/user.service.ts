import { AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider'
import type {
  CreateUserBody,
  UpdateUserBody,
  User,
  UserIdParams
} from '@shared/config'
import { prisma } from '@shared/neon'

import { env } from '@/config/env.js'
import { AppError } from '@/error/lib/AppError.js'
import { catchAsyncError } from '@/error/utils/catchError.js'
import { type AppAbility, subject } from '@/lib/casl-prisma.js'
import { cognitoClient } from '@/lib/cognito.js'

export const UserService = {
  getAll: (ability: AppAbility) =>
    catchAsyncError(
      (async () => {
        if (!ability.can('manage', 'all'))
          throw new AppError('FORBIDDEN', 'Only admins can list users')

        return prisma.user.findMany({
          orderBy: { createdAt: 'desc' }
        })
      })()
    ),

  getById: (id: UserIdParams['id'], ability: AppAbility) =>
    catchAsyncError(
      (async () => {
        const user = await prisma.user.findUnique({
          where: { id }
        })

        if (!user) throw new AppError('NOT_FOUND', 'User not found')
        if (
          !ability.can('read', subject('User', user)) &&
          !ability.can('manage', 'all')
        )
          throw new AppError('FORBIDDEN', 'Cannot read this user')

        return user
      })()
    ),

  getMe: (cognitoSub: User['cognitoSub'], role: User['role']) =>
    catchAsyncError(
      (async () => {
        const user = await prisma.user.findUnique({
          where: { cognitoSub }
        })

        if (!user) throw new AppError('NOT_FOUND', 'User not found')

        return { ...user, role }
      })()
    ),

  create: (input: CreateUserBody) =>
    catchAsyncError(
      prisma.user
        .findUnique({
          where: { cognitoSub: input.cognitoSub }
        })
        .then((existingUser) => {
          if (existingUser) return existingUser

          // Create new user
          return prisma.user.create({
            data: input
          })
        })
    ),

  update: (
    id: UserIdParams['id'],
    input: UpdateUserBody,
    ability: AppAbility
  ) =>
    catchAsyncError(
      (async () => {
        const user = await prisma.user.findUnique({
          where: { id }
        })

        if (!user) throw new AppError('NOT_FOUND', 'User not found')
        if (
          !ability.can('update', subject('User', user)) &&
          !ability.can('manage', 'all')
        )
          throw new AppError('FORBIDDEN', 'Cannot update this user')

        return prisma.user.update({
          where: { id },
          data: input
        })
      })()
    ),

  delete: (id: UserIdParams['id'], ability: AppAbility) =>
    catchAsyncError(
      (async () => {
        const user = await prisma.user.findUnique({
          where: { id }
        })

        if (!user) throw new AppError('NOT_FOUND', 'User not found')
        if (
          !ability.can('delete', subject('User', user)) &&
          !ability.can('manage', 'all')
        )
          throw new AppError('FORBIDDEN', 'Cannot delete this user')

        await prisma.user.delete({
          where: { id }
        })

        await cognitoClient.send(
          new AdminDeleteUserCommand({
            UserPoolId: env.COGNITO_USERPOOL_ID,
            Username: user.cognitoSub
          })
        )

        return user
      })()
    )
} as const
