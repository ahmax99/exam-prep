import { AbilityBuilder, createMongoAbility } from '@casl/ability'
import { COGNITO_GROUPS } from '@shared/config'

import type { AppAbility } from '@/lib/casl'

export const getUserPermissions = (user?: {
  id: string
  role: string[]
}): AppAbility => {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

  // Public permissions (unauthenticated users)
  can('read', 'Post')
  can('read', 'Comment')

  if (!user) return build()

  // Authenticated users (Users group)
  if (user.role.includes(COGNITO_GROUPS.USERS)) {
    can('create', 'Comment')
    can('update', 'Comment', { authorId: user.id })
    can('delete', 'Comment', { authorId: user.id })
  }

  // Admins (Admins group)
  if (user.role.includes(COGNITO_GROUPS.ADMINS)) {
    can('create', 'Post')
    can('manage', 'all')
  }

  return build()
}
