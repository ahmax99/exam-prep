import { z } from 'zod'

export const AccountFormModel = {
  updateProfile: z.object({
    name: z.string().min(1, 'Name is required'),
    imagePath: z.string().nullish()
  })
}

export type UpdateProfileSchema = z.infer<typeof AccountFormModel.updateProfile>
