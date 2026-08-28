import { z } from 'zod'

export const PostFormModel = {
  createPost: z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    image: z.string().optional()
  })
}

export type CreatePostSchema = z.infer<typeof PostFormModel.createPost>
