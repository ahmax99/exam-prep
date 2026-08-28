'use client'

import { subject } from '@casl/ability'
import { useAbility } from '@casl/react'
import type { Post } from '@shared/config'
import { Trash2 } from 'lucide-react'

import { ActionButton } from '@/components/organisms'
import type { AppAbility } from '@/lib/casl'

import { usePostActions } from '../hooks/usePostActions'

interface DeletePostButtonProps {
  post: Pick<Post, 'id' | 'authorId'>
}

export const DeletePostButton = ({ post }: DeletePostButtonProps) => {
  const ability = useAbility<AppAbility>()
  const { handleDeletePost } = usePostActions()

  if (!ability.can('delete', subject('Post', post))) return null

  return (
    <ActionButton
      action={() => handleDeletePost(post.id)}
      areYouSureDescription="This will permanently delete this post."
      aria-label="Delete post"
      requireAreYouSure
      size="icon"
      variant="ghost"
    >
      <Trash2 className="text-destructive size-4" />
    </ActionButton>
  )
}
