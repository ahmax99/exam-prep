import { AppError } from '@/error/lib/AppError.js'
import { catchAsyncError } from '@/error/utils/catchError.js'

interface AuthorizeResourceOptions<TRecord> {
  notFound: string
  forbidden: string
  can: (record: TRecord) => boolean
}

export const authorizeResource = <TRecord extends object, TResult>(
  queryOrAllowed: Promise<TRecord | null> | boolean,
  optionsOrForbidden: AuthorizeResourceOptions<TRecord> | string,
  action?: ((record: TRecord) => Promise<TResult>) | (() => Promise<TResult>)
) => {
  if (typeof queryOrAllowed === 'boolean') {
    const allowed = queryOrAllowed
    const forbidden = optionsOrForbidden as string
    const perform = action as () => Promise<TResult>

    return catchAsyncError(
      (async () => {
        if (!allowed) throw new AppError('FORBIDDEN', forbidden)
        return perform()
      })()
    )
  }

  const query = queryOrAllowed
  const options = optionsOrForbidden as AuthorizeResourceOptions<TRecord>

  return catchAsyncError(
    (async () => {
      const record = await query
      switch (true) {
        case !record:
          throw new AppError('NOT_FOUND', options.notFound)
        case !options.can(record!):
          throw new AppError('FORBIDDEN', options.forbidden)
        default:
          if (action)
            return (action as (record: TRecord) => Promise<TResult>)(record!)
          return record!
      }
    })()
  )
}
