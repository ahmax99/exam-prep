import { Skeleton } from '@/components/atoms'

export default function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center">
      <div className="w-full space-y-4 sm:max-w-96">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
