import type { Ability } from '@casl/ability'
import type { PrismaQueryOf, Subjects } from '@casl/prisma'
import type { Prisma } from '@shared/neon'

export { subject } from '@casl/ability'
export { accessibleBy, createPrismaAbility } from '@casl/prisma'

type Action = 'create' | 'read' | 'update' | 'delete' | 'manage'

type AppSubjects =
  | 'all'
  | Subjects<{
      User: Prisma.UserGetPayload<object>
      Post: Prisma.PostGetPayload<object>
      Comment: Prisma.CommentGetPayload<object>
    }>

export type AppAbility = Ability<
  [Action, AppSubjects],
  PrismaQueryOf<Prisma.TypeMap>
>
