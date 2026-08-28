'use client'

import type { CommentIdParams } from '@shared/config'
import { Trash2 } from 'lucide-react'

import { ActionButton } from '@/components/organisms'

import { useCommentActions } from '../hooks/useCommentActions'

interface DeleteCommentButtonProps {
  commentId: CommentIdParams['id']
}

export const DeleteCommentButton = ({
  commentId
}: DeleteCommentButtonProps) => {
  const { handleDeleteComment } = useCommentActions()

  return (
    <ActionButton
      action={() => handleDeleteComment(commentId)}
      areYouSureDescription="This will permanently delete your comment."
      requireAreYouSure
      size="icon"
      variant="ghost"
    >
      <Trash2 className="text-destructive size-4" />
    </ActionButton>
  )
}
