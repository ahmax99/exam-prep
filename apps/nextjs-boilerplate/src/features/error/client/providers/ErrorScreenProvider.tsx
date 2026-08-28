'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/molecules'
import { PUBLIC_ROUTES } from '@/features/auth/lib/routes'
import { captureError } from '@/features/error-tracking/utils/captureError'

import { useErrorStore } from '../stores/useErrorStore'

export const ErrorScreenProvider = () => {
  const router = useRouter()
  const { error, clearError } = useErrorStore()

  useEffect(() => {
    if (error) captureError(error)
  }, [error])

  return (
    <AlertDialog open={!!error}>
      <AlertDialogContent className="flex flex-col items-center">
        <AlertDialogHeader>
          <AlertDialogTitle>Something went wrong</AlertDialogTitle>
          <AlertDialogDescription>{error?.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              clearError()
              router.refresh()
            }}
          >
            Try again
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              clearError()
              router.push(PUBLIC_ROUTES.HOME)
            }}
          >
            Go home
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
