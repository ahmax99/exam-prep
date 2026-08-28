import { catchSyncError } from '@/features/error/utils/catchError'

export const safeRelativePath = (value: string | null | undefined) => {
  if (!value?.startsWith('/')) return null
  if (value.startsWith('//') || value.startsWith('/\\')) return null

  const base = 'http://localhost'

  return catchSyncError(() => {
    // Resolve against a throwaway origin; if the result escapes that origin, reject it.
    const url = new URL(value, base)
    if (url.origin !== base) return null

    return `${url.pathname}${url.search}${url.hash}`
  }).unwrapOr(null)
}
