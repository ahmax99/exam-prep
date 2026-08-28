'use client'

import { useRouter } from 'next/navigation'

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

import { useErrorStore } from '../stores/useErrorStore'

export const ErrorScreenProvider = () => {
  const router = useRouter()
  const { error, clearError } = useErrorStore()

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
              router.push('/')
            }}
          >
            Go home
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
