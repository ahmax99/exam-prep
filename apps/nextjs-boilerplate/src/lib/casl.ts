import type { MongoAbility } from '@casl/ability'

type Action = 'create' | 'read' | 'update' | 'delete' | 'manage'

type AppSubjects =
  | 'all'
  | 'Post'
  | 'Comment'
  | 'User'
  | { id: string; authorId?: string }

export type AppAbility = MongoAbility<[Action, AppSubjects]>
