import { MasteryBar, MicroLabel } from '@/components/atoms'
import type { TopicMastery } from '@/features/progress/server/api'
import { cn } from '@/utils/mergeClass'

interface OverallMasteryCardProps {
  topics: TopicMastery[]
  className?: string
}

const rollUp = (topics: TopicMastery[]) =>
  topics.reduce(
    (totals, topic) => ({
      mastered: totals.mastered + topic.mastered,
      shaky: totals.shaky + topic.shaky,
      total: totals.total + topic.total
    }),
    { mastered: 0, shaky: 0, total: 0 }
  )

const OverallMasteryCard = ({
  topics,
  className
}: Readonly<OverallMasteryCardProps>) => {
  const { mastered, shaky, total } = rollUp(topics)

  return (
    <section
      aria-label="Overall mastery"
      className={cn(
        'border-border bg-card flex min-h-[208px] flex-col justify-between gap-8 rounded-md px-8 py-[30px]',
        className
      )}
      data-slot="overall-mastery-card"
    >
      <div>
        <MicroLabel>Overall mastery</MicroLabel>
        <p className="mt-3.5 flex items-baseline gap-2">
          <span
            className="font-mono text-[40px] leading-none tracking-[-0.07em]"
            data-numeric
          >
            {mastered}
          </span>
          <span className="text-muted-foreground font-mono text-[15px] tracking-[-0.05em]">
            / {total}
          </span>
        </p>
      </div>

      <div>
        <MasteryBar
          animate
          className="h-2"
          mastered={mastered}
          shaky={shaky}
          total={total}
        />
        <div className="text-muted-foreground mt-3.5 flex gap-5 font-mono text-[10px]">
          <span className="flex items-center gap-[7px]">
            <span
              aria-hidden="true"
              className="bg-success size-2 rounded-full"
            />
            mastered {mastered}
          </span>
          <span className="flex items-center gap-[7px]">
            <span
              aria-hidden="true"
              className="bg-warning size-2 rounded-full"
            />
            shaky {shaky}
          </span>
        </div>
      </div>
    </section>
  )
}

export { OverallMasteryCard }
