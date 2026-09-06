import type { Shortcut } from '@/features/drill/lib/shortcuts'

interface ShortcutsListProps {
  shortcuts: Shortcut[]
}

function ShortcutsList({ shortcuts }: Readonly<ShortcutsListProps>) {
  return (
    <dl className="flex flex-col gap-2">
      {shortcuts.map((shortcut) => (
        <div key={shortcut.combo} className="flex items-baseline gap-3">
          <dt className="w-[30px] shrink-0 font-mono text-[10px]">
            {shortcut.combo}
          </dt>
          <dd className="text-muted-foreground m-0 text-[13px]">
            {shortcut.description}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export { ShortcutsList }
