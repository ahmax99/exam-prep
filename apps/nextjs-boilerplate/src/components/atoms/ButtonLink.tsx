'use client'

import Link from 'next/link'

import type { VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/mergeClass'

import { LoadingSwap } from '../molecules/LoadingSwap'

import { Button } from './Button'
import type { buttonVariants } from './Button.variants'

function ButtonLink({
  variant = 'default',
  size = 'default',
  className,
  disabled,
  isLoading = false,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Link> &
  VariantProps<typeof buttonVariants> & {
    disabled?: boolean
    isLoading?: boolean
  }) {
  return (
    <Button
      aria-disabled={disabled ?? isLoading}
      className={cn(
        (disabled ?? isLoading) && 'cursor-not-allowed opacity-50',
        className
      )}
      nativeButton={false}
      onClick={(e) => (disabled ?? isLoading) && e.preventDefault()}
      render={<Link {...props} />}
      size={size}
      variant={variant}
    >
      <LoadingSwap
        className="inline-flex items-center gap-2"
        isLoading={isLoading}
      >
        {children}
      </LoadingSwap>
    </Button>
  )
}

export { ButtonLink }
