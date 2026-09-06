import { cn } from '@/utils/mergeClass'

interface ShortcutHintProps {
  keyLabel: string
  className?: string
}

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
