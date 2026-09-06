import Link from 'next/link'

import { Bookmark, History, NotebookText } from 'lucide-react'

interface BottomTabBarProps {
  savedHref: string | null
  runsHref: string | null
}

function BottomTabBar({ savedHref, runsHref }: Readonly<BottomTabBarProps>) {
  const tabs = [
    { label: 'Study', icon: NotebookText, href: '/' },
    ...(savedHref ? [{ label: 'Saved', icon: Bookmark, href: savedHref }] : []),
    ...(runsHref ? [{ label: 'Runs', icon: History, href: runsHref }] : [])
  ]

  return (
    <nav
      aria-label="Primary"
      className="bg-card border-border h-bottom-nav pb-safe-bottom fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t lg:hidden"
      data-slot="bottom-tab-bar"
    >
      {tabs.map(({ label, icon: Icon, href }) => (
        <Link
          key={label}
          className="text-muted-foreground hover:text-foreground flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 text-[11px] transition-colors"
          href={href}
        >
          <Icon className="size-5" />
          {label}
        </Link>
      ))}
    </nav>
  )
}

export { BottomTabBar }
