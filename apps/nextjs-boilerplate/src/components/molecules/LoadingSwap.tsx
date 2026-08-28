import { cn } from '@/utils/mergeClass'

import { Spinner } from '../atoms/Spinner'

interface LoadingSwapProps {
  isLoading: boolean
  children: React.ReactNode
  className?: string
}

function LoadingSwap({
  isLoading,
  children,
  className
}: Readonly<LoadingSwapProps>) {
  return (
    <div className="grid grid-cols-1 items-center justify-items-center">
      <div
        className={cn(
          'col-start-1 col-end-2 row-start-1 row-end-2 w-full',
          isLoading ? 'invisible' : 'visible',
          className
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          'col-start-1 col-end-2 row-start-1 row-end-2',
          isLoading ? 'visible' : 'invisible',
          className
        )}
      >
        <Spinner />
      </div>
    </div>
  )
}

export { LoadingSwap }
