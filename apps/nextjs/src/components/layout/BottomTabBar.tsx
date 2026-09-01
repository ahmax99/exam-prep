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
      className="bg-background border-border fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
      data-slot="bottom-tab-bar"
    >
      {tabs.map(({ label, icon: Icon, href }) => (
        <Link
          key={label}
          className="flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 text-xs"
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
