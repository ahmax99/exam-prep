import { z } from 'zod'

export const PostModel = {
  post: z.object({
    id: z.uuid(),
    title: z.string(),
    content: z.string(),
    authorId: z.uuid(),
    imagePath: z.string().optional(),
    slug: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().optional()
  }),
  postIdParams: z.object({
    id: z.uuid()
  }),
  createPostBody: z.object({
    title: z.string().min(1).max(255),
    content: z.string().min(1),
    authorId: z.uuid(),
    imagePath: z.string().optional(),
    slug: z.string().optional()
  }),
  updatePostBody: z.object({
    title: z.string().min(1).max(255),
    content: z.string().min(1).optional(),
    slug: z.string().optional()
  }),
  uploadImageQuery: z.object({
    filename: z.preprocess(
      (val) => (Array.isArray(val) ? val.join('') : val),
      z.string().min(1).max(255)
    ),
    contentType: z.preprocess(
      (val) => (Array.isArray(val) ? val[0] : val),
      z.string().regex(/^image\//)
    )
  })
}

export type Post = z.infer<typeof PostModel.post>
export type PostIdParams = z.infer<typeof PostModel.postIdParams>
export type CreatePostBody = z.infer<typeof PostModel.createPostBody>
export type UpdatePostBody = z.infer<typeof PostModel.updatePostBody>
export type UploadImageQuery = z.infer<typeof PostModel.uploadImageQuery>
