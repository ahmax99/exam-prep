'use client'

import { useTransition } from 'react'

import type { Button as ButtonPrimitive } from '@base-ui/react/button'
import type { VariantProps } from 'class-variance-authority'
import { toast } from 'sonner'

import { Button } from '../atoms/Button'
import type { buttonVariants } from '../atoms/Button.variants'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../molecules/AlertDialog'
import { LoadingSwap } from '../molecules/LoadingSwap'

interface ActionButtonProps
  extends
    Omit<ButtonPrimitive.Props, 'children'>,
    VariantProps<typeof buttonVariants> {
  action: () => Promise<{ error: boolean; message?: string }>
  requireAreYouSure?: boolean
  areYouSureDescription?: React.ReactNode
  children?: React.ReactNode
}

function ActionButton({
  action,
  requireAreYouSure = false,
  areYouSureDescription = 'This action cannot be undone.',
  variant,
  size,
  disabled,
  onClick,
  children,
  ...props
}: Readonly<ActionButtonProps>) {
  const [isLoading, startTransition] = useTransition()

  const performAction = () =>
    startTransition(async () => {
      const data = await action()
      if (data.error) toast.error(data.message ?? 'Error')
    })

  if (requireAreYouSure)
    return (
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              disabled={disabled}
              size={size}
              variant={variant}
              {...props}
            >
              {children}
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {areYouSureDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isLoading} onClick={performAction}>
              <LoadingSwap isLoading={isLoading}>Yes</LoadingSwap>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

  return (
    <Button
      disabled={disabled ?? isLoading}
      onClick={(e) => {
        performAction()
        onClick?.(e)
      }}
      size={size}
      variant={variant}
      {...props}
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

export { ActionButton }
