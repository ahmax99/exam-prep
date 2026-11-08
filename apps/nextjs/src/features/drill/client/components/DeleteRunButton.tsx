'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/atoms'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/molecules'
import { deleteRun } from '@/features/drill/client/lib/deleteRun'

interface DeleteRunButtonProps {
  runId: string
  runLabel: string
}

function DeleteRunButton({ runId, runLabel }: Readonly<DeleteRunButtonProps>) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const onConfirm = () => {
    if (isDeleting) return
    setIsDeleting(true)

    deleteRun(runId)
      .match(
        () => {
          setOpen(false)
          router.refresh()
          toast.success('Run deleted')
        },
        (error) => toast.error(error.message)
      )
      .finally(() => {
        setIsDeleting(false)
      })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            aria-label={`Delete run started ${runLabel}`}
            size="icon"
            variant="ghost"
          />
        }
      >
        <Trash2 className="size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Delete this run?</AlertDialogTitle>
        <AlertDialogDescription>
          The run started {runLabel} is removed from your history and its
          summary can no longer be opened. The answers you gave still count
          toward your mastery and stats. This can&apos;t be undone.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogClose
            disabled={isDeleting}
            render={<Button size="sm" variant="outline" />}
          >
            Cancel
          </AlertDialogClose>
          <Button
            disabled={isDeleting}
            size="sm"
            variant="destructive"
            onClick={onConfirm}
          >
            {isDeleting ? 'Deleting…' : 'Delete run'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { DeleteRunButton }
