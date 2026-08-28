import Link from 'next/link'

import { Logo } from '../molecules/Logo'

const PageHeader = () => {
  return (
    <header className="px-4 md:px-6">
      <nav className="flex h-16 justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </nav>
    </header>
  )
}

export { PageHeader }
