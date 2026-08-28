import { z } from 'zod'

export const UserModel = {
  user: z.object({
    id: z.uuid(),
    cognitoSub: z.string(),
    email: z.email(),
    name: z.string(),
    imagePath: z.string().optional(),
    role: z.array(z.string()),
    createdAt: z.date(),
    updatedAt: z.date()
  }),
  userIdParams: z.object({
    id: z.uuid()
  }),
  createUserBody: z.object({
    cognitoSub: z.string().min(1),
    email: z.email(),
    name: z.string(),
    imagePath: z.string().optional()
  }),
  updateUserBody: z.object({
    name: z.string().optional(),
    imagePath: z.string().optional()
  })
}

export type User = z.infer<typeof UserModel.user>
export type UserIdParams = z.infer<typeof UserModel.userIdParams>
export type CreateUserBody = z.infer<typeof UserModel.createUserBody>
export type UpdateUserBody = z.infer<typeof UserModel.updateUserBody>
