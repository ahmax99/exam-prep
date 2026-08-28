import { Skeleton } from '@/components/atoms'

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Skeleton className="mb-6 h-10 w-24" />
      <Skeleton className="mb-8 h-[400px] w-full rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-12 w-3/4" />

        <Skeleton className="h-4 w-32" />
      </div>
      <div className="mt-8 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}
