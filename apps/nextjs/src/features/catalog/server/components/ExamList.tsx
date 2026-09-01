import Link from 'next/link'

import type { CertificationExam } from '@/features/catalog/server/api'
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
      className="flex flex-col gap-2"
      data-slot="exam-list"
    >
      <ul className="flex flex-col gap-2">
        {exams.map((exam) => {
          const selected = exam.code === selectedCode

          return (
            <li
              className={cn(
                'border-border bg-card flex min-h-11 items-center gap-2 rounded-lg border p-3',
                selected && 'border-foreground/40'
              )}
              data-selected={selected || undefined}
              key={exam.code}
            >
              <Link
                aria-current={selected ? 'true' : undefined}
                className="flex min-h-11 flex-1 items-center gap-3"
                href={`/${certSlug}?exam=${exam.code}`}
              >
                <span className="font-mono text-sm">{exam.code}</span>
                <span className="flex-1 truncate">{exam.title}</span>
                <span
                  aria-label={`${exam.questionCount} questions`}
                  className="text-muted-foreground font-mono text-sm"
                >
                  {exam.questionCount}
                </span>
              </Link>
              {exam.questionCount > 0 && (
                <Link
                  className="text-muted-foreground hover:border-foreground/30 border-border flex min-h-11 items-center rounded-md border px-3 text-sm"
                  href={`/${certSlug}/drill?scopeKind=EXAM&scopeValue=${exam.code}`}
                >
                  Drill {exam.questionCount} →
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
