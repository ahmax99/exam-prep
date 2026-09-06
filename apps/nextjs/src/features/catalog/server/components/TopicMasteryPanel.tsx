import Link from 'next/link'

import { CategoryDot, Empty, MasteryBar } from '@/components/atoms'
import { drillHref } from '@/features/drill/lib/drillHref'
import type { TopicMastery } from '@/features/progress/server/api'
import { categoryColors } from '@/utils/categoryColor'
import { cn } from '@/utils/mergeClass'

interface TopicMasteryPanelProps {
  certSlug: string
  topics: TopicMastery[]
}

const TopicMasteryPanel = ({
  certSlug,
  topics
}: Readonly<TopicMasteryPanelProps>) => {
  const colors = categoryColors(topics.map((topic) => topic.topic))

  return (
    <section
      aria-label="Topics"
      className="mt-14"
      data-slot="topic-mastery-panel"
    >
      <h2 className="text-xl font-semibold tracking-tight">Topics</h2>

      {topics.length === 0 ? (
        <Empty
          className="mt-3.5"
          description="Topics appear here once an exam's question bank is seeded. Each row tracks how much of that topic you have mastered."
          label="Topic mastery"
          title="No topics for this exam yet"
        />
      ) : (
        <div className="border-border bg-card mt-3.5 overflow-hidden rounded-md border">
          <div className="border-border bg-table-header text-muted-foreground hidden h-10 items-center gap-5 border-b px-[22px] font-mono text-[9px] font-medium tracking-widest uppercase sm:flex">
            <span className="w-2" />
            <span className="flex-1">Topic</span>
            <span className="w-44">Mastery</span>
            <span className="w-[62px] text-right">Count</span>
          </div>

          {topics.map((topic, index) => (
            <Link
              className={cn(
                'hover:bg-muted focus-visible:ring-ring/50 flex min-h-14 flex-wrap items-center gap-x-5 gap-y-2.5 px-[22px] py-3 transition-colors focus-visible:ring-[3px] focus-visible:outline-none sm:flex-nowrap sm:py-0',
                index > 0 && 'border-row-border border-t'
              )}
              href={drillHref(certSlug, {
                scopeKind: 'TOPIC',
                scopeValue: topic.topic
              })}
              key={topic.topic}
            >
              <CategoryDot
                color={colors.get(topic.topic) ?? 'var(--category-1)'}
              />
              <span className="min-w-0 flex-1 truncate text-[15px]">
                {topic.topic}
              </span>
              {/* Below sm the row wraps and the bar takes the full width —
                  four columns will not fit a phone. */}
              <MasteryBar
                className="bg-row-border dark:bg-secondary order-last h-1.5 w-full sm:order-none sm:w-44"
                mastered={topic.mastered}
                shaky={topic.shaky}
                total={topic.total}
              />
              <span
                aria-label={`${topic.mastered} of ${topic.total} mastered`}
                className="w-[62px] shrink-0 text-right font-mono text-[10px] tracking-[-0.04em]"
                data-numeric
              >
                {topic.mastered}/{topic.total}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export { TopicMasteryPanel }
