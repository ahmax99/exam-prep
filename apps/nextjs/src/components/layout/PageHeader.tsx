import Link from 'next/link'

import { Logo } from '../molecules/Logo'
import { ThemeToggle } from '../organisms/ThemeToggle'

const PageHeader = () => {
  return (
    <header className="border-border bg-background sticky top-0 z-20 border-b px-4 md:px-6">
      <nav className="h-header-nav flex items-center justify-between gap-4">
        <Link
          className="focus-visible:ring-ring/50 rounded-sm focus-visible:ring-[3px] focus-visible:outline-none"
          href="/"
        >
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}

export { PageHeader }
