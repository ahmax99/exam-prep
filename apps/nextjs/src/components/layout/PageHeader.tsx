import Link from 'next/link'

import { Logo } from '../molecules/Logo'
import { SidebarTrigger } from '../organisms/Sidebar'
import { ThemeToggle } from '../organisms/ThemeToggle'

const PageHeader = () => {
  return (
    <header className="border-border bg-background sticky top-0 z-20 border-b px-4 md:px-6">
      {/* Chrome recedes so the content can peak: h-14, not h-16. */}
      <nav className="flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="hidden lg:inline-flex" />
          <Link
            className="focus-visible:ring-ring/50 rounded-sm focus-visible:ring-[3px] focus-visible:outline-none"
            href="/"
          >
            <Logo />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}

export { PageHeader }
