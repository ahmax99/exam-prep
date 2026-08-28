import { Skeleton } from '@/components/atoms'

export default function Loading() {
  return (
    <div className="mx-auto my-6 max-w-2xl px-4">
      <div className="mb-8">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="flex w-full flex-col items-center justify-center">
        <div className="w-full space-y-4 sm:max-w-96">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}
