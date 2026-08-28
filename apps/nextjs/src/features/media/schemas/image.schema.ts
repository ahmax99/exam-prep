import { z } from 'zod'

import { ALLOWED_IMAGE_EXTENSIONS } from '@/features/media/constants'

export const imagePathSchema = z
  .string()
  .min(1)
  .max(1024)
  .regex(
    /^[\w./-]+$/,
    'path may only contain letters, numbers, dots, hyphens, underscores, and slashes'
  )
  .refine((path) => !path.includes('..'), 'path may not contain ".."')
  .refine((path) => !path.startsWith('/'), 'path may not start with "/"')
  .refine(
    (path) =>
      ALLOWED_IMAGE_EXTENSIONS.some((ext) =>
        path.toLowerCase().endsWith(`.${ext}`)
      ),
    'path must end with a supported image extension'
  )
