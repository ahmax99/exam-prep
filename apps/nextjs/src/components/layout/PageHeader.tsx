import Link from 'next/link'

import { Logo } from '../molecules/Logo'
import { SidebarTrigger } from '../organisms/Sidebar'

const PageHeader = () => {
  return (
    <header className="border-border bg-background sticky top-0 z-20 border-b px-4 md:px-6">
      <nav className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="hidden lg:inline-flex" />
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </nav>
    </header>
  )
}

export { PageHeader }
