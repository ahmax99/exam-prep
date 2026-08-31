import { z } from 'zod'

import { BOOKMARK_NOTE_MAX_LENGTH } from '@/features/bookmarks/constants'

export const bookmarkQuestionIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/)

// Three-valued on purpose: key absent (undefined) leaves an existing note
// untouched, null/whitespace-only clears it, a non-empty string sets it.
export const bookmarkBodySchema = z.object({
  note: z
    .string()
    .trim()
    .max(BOOKMARK_NOTE_MAX_LENGTH)
    .nullable()
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined
      return value && value.length > 0 ? value : null
    })
})
export type BookmarkBody = z.infer<typeof bookmarkBodySchema>

export const bookmarkSchema = z.object({
  questionId: z.string(),
  note: z.string().nullable(),
  createdAt: z.iso.datetime()
})
export type Bookmark = z.infer<typeof bookmarkSchema>
