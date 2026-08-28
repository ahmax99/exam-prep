import { z } from 'zod'

export const CommentFormModel = {
  createComment: z.object({
    content: z.string().min(1, 'Content is required'),
    postId: z.string().min(1, 'Post ID is required')
  })
}

export type CreateCommentSchema = z.infer<typeof CommentFormModel.createComment>
