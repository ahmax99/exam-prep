import type { Comment, CommentIdParams, PostIdParams } from '@shared/config'

import { serverApiClient, serverAuthApiClient } from '@/lib/serverApiClient'

export const fetchAllComments = async (postId: PostIdParams['id']) =>
  serverApiClient
    .get('comments', { searchParams: { postId } })
    .json<Comment[]>()

export const createComment = async (comment: Comment) =>
  serverAuthApiClient.post('comments', { json: comment }).json<Comment>()

export const deleteComment = async (commentId: CommentIdParams['id']) =>
  serverAuthApiClient.delete(`comments/${commentId}`).json()
