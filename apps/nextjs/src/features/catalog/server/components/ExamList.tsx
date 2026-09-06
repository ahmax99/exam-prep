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
    <section
      aria-label="Exams"
      className="border-border bg-card overflow-hidden rounded-md border"
      data-slot="exam-list"
    >
      {exams.map((exam, index) => {
        const selected = exam.code === selectedCode

        return (
          <div
            className={cn(
              'flex min-h-[60px] flex-wrap items-center gap-x-[18px] gap-y-2 px-[22px] py-2',
              index > 0 && 'border-row-border border-t',
              selected && 'bg-row-active'
            )}
            key={exam.code}
          >
            <Link
              aria-current={selected ? 'true' : undefined}
              className="focus-visible:ring-ring/50 flex min-h-11 flex-1 items-center gap-[18px] rounded-[4px] focus-visible:ring-[3px] focus-visible:outline-none"
              href={`/${certSlug}?exam=${exam.code}`}
            >
              <span
                className={cn(
                  'font-mono text-[11px] tracking-[-0.04em]',
                  selected ? 'text-accent-foreground' : 'text-muted-foreground'
                )}
                data-numeric
              >
                {exam.code}
              </span>
              <span
                className={cn(
                  'flex-1 truncate text-[15px]',
                  selected ? 'font-medium' : 'text-muted-foreground'
                )}
              >
                {exam.title}
              </span>
              <span
                className="text-muted-foreground font-mono text-[10px] tracking-[-0.04em]"
                data-numeric
              >
                {exam.questionCount}
              </span>
            </Link>
            {exam.questionCount > 0 && (
              <Link
                aria-label={`Drill exam ${exam.code}`}
                className={cn(
                  'focus-visible:ring-ring/50 inline-flex h-9 shrink-0 items-center rounded-[4px] border px-4 text-[13px] font-medium transition-colors focus-visible:ring-[3px] focus-visible:outline-none',
                  selected
                    ? 'border-brand text-accent-foreground hover:bg-accent'
                    : 'border-outline text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                href={drillHref(certSlug, {
                  scopeKind: 'EXAM',
                  scopeValue: exam.code
                })}
              >
                Drill
              </Link>
            )}
          </div>
        )
      })}
    </section>
  )
}

export { ExamList }
