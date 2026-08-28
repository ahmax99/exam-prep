import { useRouter } from 'next/navigation'

import type { CommentIdParams } from '@shared/config'

import { useErrorHandler } from '@/features/error/client/hooks/useErrorHandler'
import { handleClientError } from '@/features/error/client/lib/handleError'

import type { CreateCommentSchema } from '../../schemas/commentForm.schema'
import { createComment, deleteComment } from '../api'

export const useCommentActions = () => {
  const router = useRouter()
  const handleError = useErrorHandler()

  const handleCreateComment = async (
    data: CreateCommentSchema,
    onSuccess?: () => void
  ) =>
    handleClientError(createComment(data), handleError, () => {
      onSuccess?.()
      router.refresh()
    })

  const handleDeleteComment = async (commentId: CommentIdParams['id']) =>
    handleClientError(deleteComment(commentId), handleError, () =>
      router.refresh()
    )

  return {
    handleCreateComment,
    handleDeleteComment
  }
}
