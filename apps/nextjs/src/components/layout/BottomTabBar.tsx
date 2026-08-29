import Link from 'next/link'

import { BarChart3, Bookmark, History, NotebookText } from 'lucide-react'

const TABS = [
  { label: 'Study', icon: NotebookText, href: '/' },
  { label: 'Saved', icon: Bookmark, href: null },
  { label: 'Runs', icon: History, href: null },
  { label: 'Stats', icon: BarChart3, href: null }
] as const

function BottomTabBar() {
  return (
    <nav
      aria-label="Primary"
      className="bg-background border-border fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
      data-slot="bottom-tab-bar"
    >
      {TABS.map(({ label, icon: Icon, href }) =>
        href ? (
          <Link
            key={label}
            className="flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 text-xs"
            href={href}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ) : (
          <span
            key={label}
            className="text-muted-foreground flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 text-xs"
          >
            <Icon className="size-5" />
            {label}
          </span>
        )
      )}
    </nav>
  )
}

export { BottomTabBar }
