import Link from 'next/link'

import { MasteryBar } from '@/components/atoms'
import type { TopicMastery } from '@/features/progress/server/api'

interface TopicMasteryPanelProps {
  certSlug: string
  topics: TopicMastery[]
}

const TopicMasteryPanel = ({
  certSlug,
  topics
}: Readonly<TopicMasteryPanelProps>) => {
  return (
    <section
      aria-label="Topics"
      className="mt-12"
      data-slot="topic-mastery-panel"
    >
      <div className="border-border flex items-baseline justify-between gap-4 border-b pb-2">
        <h2 className="text-xl leading-snug font-medium">Topics</h2>
        <p className="text-muted-foreground shrink-0 text-sm">Mastered</p>
      </div>

      {topics.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">
          No topics for this exam yet.
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {topics.map((topic) => (
            <li key={topic.topic}>
              <Link
                className="hover:bg-muted/60 focus-visible:ring-ring/50 -mx-3 flex min-h-14 items-center gap-4 rounded-md px-3 transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
                href={`/${certSlug}/drill?scopeKind=TOPIC&scopeValue=${encodeURIComponent(topic.topic)}`}
              >
                <span className="flex-1 truncate text-sm">{topic.topic}</span>
                <MasteryBar
                  className="hidden w-28 sm:flex"
                  mastered={topic.mastered}
                  shaky={topic.shaky}
                  total={topic.total}
                />
                <span
                  aria-label={`${topic.mastered} of ${topic.total} mastered`}
                  className="w-16 shrink-0 text-right font-mono text-sm"
                  data-numeric
                >
                  {topic.mastered}/{topic.total}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export { TopicMasteryPanel }
