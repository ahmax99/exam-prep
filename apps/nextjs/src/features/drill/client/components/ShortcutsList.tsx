import type { Shortcut } from '@/features/drill/lib/shortcuts'

interface ShortcutsListProps {
  shortcuts: Shortcut[]
}

function ShortcutsList({ shortcuts }: Readonly<ShortcutsListProps>) {
  return (
    <dl className="flex flex-col gap-1.5 text-sm">
      {shortcuts.map((shortcut) => (
        <div key={shortcut.combo} className="flex items-center gap-2">
          <dt>
            <kbd className="font-mono text-xs">{shortcut.combo}</kbd>
          </dt>
          <dd className="text-muted-foreground">{shortcut.description}</dd>
        </div>
      ))}
    </dl>
  )
}

export { ShortcutsList }
