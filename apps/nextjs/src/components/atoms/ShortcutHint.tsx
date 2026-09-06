import { cn } from '@/utils/mergeClass'

interface ShortcutHintProps {
  keyLabel: string
  className?: string
}

/* Every binding in the app is visible: as this hint inside the control it
   drives, and again as the context rail's shortcut list. Hidden below md,
   where there is no keyboard to hint at. */
const ShortcutHint = ({ keyLabel, className }: Readonly<ShortcutHintProps>) => (
  <span
    aria-hidden="true"
    className={cn('hidden font-mono text-[10px] md:inline', className)}
    data-slot="shortcut-hint"
  >
    {keyLabel}
  </span>
)

export { ShortcutHint }
