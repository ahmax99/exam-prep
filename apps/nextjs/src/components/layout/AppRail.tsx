import Link from 'next/link'

interface AppRailCertification {
  slug: string
  name: string
  questionCount: number
}

interface AppRailPracticeItem {
  label: string
  count: number | null
  href: string | null
}

interface AppRailProps {
  certifications: AppRailCertification[]
  practiceItems: AppRailPracticeItem[]
}

function AppRail({ certifications, practiceItems }: Readonly<AppRailProps>) {
  return (
    <aside
      className="border-border bg-background hidden h-svh w-56 shrink-0 flex-col gap-6 border-r px-4 py-6 lg:flex"
      data-slot="app-rail"
    >
      <nav aria-label="Certifications" className="flex flex-col gap-1">
        <h2 className="text-muted-foreground px-2 text-xs font-medium tracking-wide uppercase">
          Certifications
        </h2>
        {certifications.length === 0 ? (
          <p className="text-muted-foreground px-2 text-sm">None seeded</p>
        ) : (
          certifications.map((certification) => (
            <Link
              key={certification.slug}
              className="hover:bg-muted flex min-h-11 items-center justify-between rounded-md px-2 text-sm"
              href={`/${certification.slug}`}
            >
              <span className="truncate">{certification.name}</span>
              <span className="text-muted-foreground font-mono">
                {certification.questionCount}
              </span>
            </Link>
          ))
        )}
      </nav>
      <nav aria-label="Practice" className="flex flex-col gap-1">
        <h2 className="text-muted-foreground px-2 text-xs font-medium tracking-wide uppercase">
          Practice
        </h2>
        {practiceItems.map((item) =>
          item.href ? (
            <Link
              key={item.label}
              className="hover:bg-muted flex min-h-11 items-center justify-between rounded-md px-2 text-sm"
              href={item.href}
            >
              <span>{item.label}</span>
              <span className="text-muted-foreground font-mono">
                {item.count ?? '—'}
              </span>
            </Link>
          ) : (
            <span
              key={item.label}
              className="text-muted-foreground flex min-h-11 items-center justify-between px-2 text-sm"
            >
              <span>{item.label}</span>
              <span className="font-mono">{item.count ?? '—'}</span>
            </span>
          )
        )}
      </nav>
    </aside>
  )
}

export { AppRail }
export type { AppRailCertification, AppRailPracticeItem }
