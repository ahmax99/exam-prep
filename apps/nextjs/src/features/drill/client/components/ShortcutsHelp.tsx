'use client'

import { CircleHelp } from 'lucide-react'

import { Button } from '@/components/atoms'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/molecules/Sheet'
import type { Shortcut } from '@/features/drill/lib/shortcuts'

import { ShortcutsList } from './ShortcutsList'

interface ShortcutsHelpProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  shortcuts: Shortcut[]
}

function ShortcutsHelp({
  isOpen,
  onOpenChange,
  shortcuts
}: Readonly<ShortcutsHelpProps>) {
  return (
    <>
      <Button
        aria-label="Keyboard shortcuts and what mastery means"
        className="min-h-11 min-w-11"
        size="icon-sm"
        variant="ghost"
        onClick={() => onOpenChange(true)}
      >
        <CircleHelp className="size-4" />
      </Button>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent data-slot="shortcuts-help" side="bottom">
          <SheetHeader>
            <SheetTitle>Keyboard shortcuts</SheetTitle>
            <SheetDescription>
              Press <kbd className="font-mono">?</kbd> any time to open this
              again.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            <ShortcutsList shortcuts={shortcuts} />
            <p className="text-muted-foreground mt-4 text-sm">
              <span className="text-foreground font-medium">Mastered</span> —
              two correct answers in a row.{' '}
              <span className="text-foreground font-medium">Missed</span> — your
              last attempt on this question was wrong.{' '}
              <span className="text-foreground font-medium">Unseen</span> — not
              attempted yet.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export { ShortcutsHelp }
