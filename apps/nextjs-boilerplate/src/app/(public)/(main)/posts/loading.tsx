import { Skeleton } from '@/components/atoms'

export default function Loading() {
  return (
    <div className="container py-12">
      <div className="pb-12 text-center">
        <Skeleton className="mx-auto h-12 w-48" />
        <Skeleton className="mx-auto mt-4 h-6 w-96 max-w-full" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {['post-skeleton-1', 'post-skeleton-2', 'post-skeleton-3'].map((id) => (
          <div className="flex flex-col space-y-3 rounded-lg" key={id}>
            <Skeleton className="h-48 w-full rounded-t-lg" />
            <div className="flex flex-col space-y-2 p-6">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="p-6 pt-0">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
