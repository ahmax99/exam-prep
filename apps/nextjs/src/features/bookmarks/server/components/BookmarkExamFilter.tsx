import Link from 'next/link'

import { cn } from '@/utils/mergeClass'

interface BookmarkExamFilterOption {
  code: string
  count: number
}

interface BookmarkExamFilterProps {
  certSlug: string
  total: number
  exams: BookmarkExamFilterOption[]
  selectedCode: string | undefined
}

interface FilterLinkProps {
  href: string
  label: string
  count: number
  selected: boolean
}

const FilterLink = ({
  href,
  label,
  count,
  selected
}: Readonly<FilterLinkProps>) => (
  <Link
    aria-current={selected ? 'true' : undefined}
    className={cn(
      'focus-visible:ring-ring/50 inline-flex min-h-11 items-center gap-2 rounded-[4px] border px-4 text-[13px] font-medium transition-colors focus-visible:ring-[3px] focus-visible:outline-none',
      selected
        ? 'border-brand text-accent-foreground bg-accent'
        : 'border-outline text-muted-foreground hover:text-foreground hover:bg-muted'
    )}
    href={href}
    scroll={false}
  >
    {label}
    <span className="font-mono text-[10px] tracking-[-0.04em]" data-numeric>
      {count}
    </span>
  </Link>
)

const BookmarkExamFilter = ({
  certSlug,
  total,
  exams,
  selectedCode
}: Readonly<BookmarkExamFilterProps>) => (
  <nav
    aria-label="Filter bookmarks by exam"
    className="flex flex-wrap gap-2"
    data-slot="bookmark-exam-filter"
  >
    <FilterLink
      count={total}
      href={`/${certSlug}/bookmarks`}
      label="All exams"
      selected={selectedCode === undefined}
    />
    {exams.map((exam) => (
      <FilterLink
        count={exam.count}
        href={`/${certSlug}/bookmarks?exam=${encodeURIComponent(exam.code)}`}
        key={exam.code}
        label={`Exam ${exam.code}`}
        selected={exam.code === selectedCode}
      />
    ))}
  </nav>
)

export { BookmarkExamFilter }
