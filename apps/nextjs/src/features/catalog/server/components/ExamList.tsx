import Link from 'next/link'

import type { CertificationExam } from '@/features/catalog/server/api'
import { drillHref } from '@/features/drill/lib/drillHref'
import { cn } from '@/utils/mergeClass'

interface ExamListProps {
  certSlug: string
  exams: CertificationExam[]
  selectedCode: string
}

const ExamList = ({
  certSlug,
  exams,
  selectedCode
}: Readonly<ExamListProps>) => {
  return (
    <section aria-label="Exams" className="flex flex-col" data-slot="exam-list">
      <ul className="divide-border border-border divide-y border-y">
        {exams.map((exam) => {
          const selected = exam.code === selectedCode

          return (
            <li
              className="flex min-h-14 items-center gap-3"
              data-selected={selected || undefined}
              key={exam.code}
            >
              <Link
                aria-current={selected ? 'true' : undefined}
                className="hover:bg-muted/60 focus-visible:ring-ring/50 -mx-3 flex min-h-14 flex-1 items-center gap-3 rounded-md px-3 transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
                href={`/${certSlug}?exam=${exam.code}`}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-6 w-0.5 shrink-0 rounded-full',
                    selected ? 'bg-brand' : 'bg-transparent'
                  )}
                />
                <span className="font-mono text-sm" data-numeric>
                  {exam.code}
                </span>
                <span
                  className={cn(
                    'flex-1 truncate text-sm',
                    selected ? 'font-medium' : 'text-muted-foreground'
                  )}
                >
                  {exam.title}
                </span>
              </Link>
              {exam.questionCount > 0 && (
                <Link
                  className="text-muted-foreground hover:border-foreground/30 hover:text-foreground border-border focus-visible:ring-ring/50 flex min-h-11 shrink-0 items-center rounded-md border px-3 text-sm transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
                  href={drillHref(certSlug, {
                    scopeKind: 'EXAM',
                    scopeValue: exam.code
                  })}
                >
                  Drill{' '}
                  <span className="ml-1 font-mono" data-numeric>
                    {exam.questionCount}
                  </span>
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export { ExamList }
