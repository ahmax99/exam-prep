import type { CommentIdParams } from '@shared/config'

import { apiClient } from '@/lib/apiClient'

import type { CreateCommentSchema } from '../../schemas/commentForm.schema'

export const createComment = async (input: CreateCommentSchema) =>
  apiClient.post('comments', { json: input }).json()

export const deleteComment = async (commentId: CommentIdParams['id']) =>
  apiClient.delete(`comments/${commentId}`).json()
