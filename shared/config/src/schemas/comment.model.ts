import { z } from 'zod'

export const CommentModel = {
  comment: z.object({
    id: z.uuid(),
    content: z.string(),
    deletedAt: z.date().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    authorId: z.uuid(),
    postId: z.uuid(),
    author: z
      .object({ name: z.string(), imagePath: z.string().optional() })
      .optional()
  }),
  commentIdParams: z.object({
    id: z.uuid()
  }),
  createCommentBody: z.object({
    content: z.string(),
    postId: z.uuid(),
    authorId: z.uuid()
  })
}

export type Comment = z.infer<typeof CommentModel.comment>
export type CommentIdParams = z.infer<typeof CommentModel.commentIdParams>
export type CreateCommentBody = z.infer<typeof CommentModel.createCommentBody>
