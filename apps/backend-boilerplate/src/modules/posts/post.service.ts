import type {
  CreatePostBody,
  PostIdParams,
  UpdatePostBody
} from '@shared/config'
import { prisma } from '@shared/neon'

import { catchAsyncError } from '@/error/utils/catchError.js'
import { authorizeResource } from '@/lib/authorizeResource.js'
import { type AppAbility, accessibleBy, subject } from '@/lib/casl-prisma.js'

export const PostService = {
  getAll: (ability: AppAbility) =>
    catchAsyncError(
      prisma.post.findMany({
        where: {
          AND: [{ deletedAt: null }, accessibleBy(ability).ofType('Post')]
        },
        orderBy: { createdAt: 'desc' }
      })
    ),

  getById: (id: PostIdParams['id'], ability: AppAbility) =>
    authorizeResource(
      prisma.post.findUnique({ where: { id, deletedAt: null } }),
      {
        notFound: 'Post not found',
        forbidden: 'Cannot read this post',
        can: (post) => ability.can('read', subject('Post', post))
      }
    ),

  create: (input: CreatePostBody, ability: AppAbility) =>
    authorizeResource(ability.can('create', 'Post'), 'Cannot create post', () =>
      prisma.post.create({
        data: {
          title: input.title,
          content: input.content,
          slug: input.slug,
          imagePath: input.imagePath,
          authorId: input.authorId,
          createdAt: new Date()
        }
      })
    ),

  update: (
    id: PostIdParams['id'],
    input: UpdatePostBody,
    ability: AppAbility
  ) =>
    authorizeResource(
      prisma.post.findUnique({ where: { id, deletedAt: null } }),
      {
        notFound: 'Post not found',
        forbidden: 'Cannot update this post',
        can: (post) => ability.can('update', subject('Post', post))
      },
      () => prisma.post.update({ where: { id }, data: input })
    ),

  delete: (id: PostIdParams['id'], ability: AppAbility) =>
    authorizeResource(
      prisma.post.findUnique({ where: { id, deletedAt: null } }),
      {
        notFound: 'Post not found',
        forbidden: 'Cannot delete this post',
        can: (post) => ability.can('delete', subject('Post', post))
      },
      () =>
        prisma.post.update({ where: { id }, data: { deletedAt: new Date() } })
    )
}
