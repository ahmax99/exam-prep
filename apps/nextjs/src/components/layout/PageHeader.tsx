import Link from 'next/link'

import { Logo } from '../molecules/Logo'
import { SidebarTrigger } from '../organisms/Sidebar'
import { ThemeToggle } from '../organisms/ThemeToggle'

const PageHeader = () => {
  return (
    <header className="border-border bg-card sticky top-0 z-20 border-b px-4 lg:px-7">
      <nav className="h-header-nav flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-2.5 lg:hidden" />
          <Link
            className="focus-visible:ring-ring/50 rounded-sm focus-visible:ring-[3px] focus-visible:outline-none"
            href="/"
          >
            <Logo />
          </Link>
        </div>
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}

export { PageHeader }
