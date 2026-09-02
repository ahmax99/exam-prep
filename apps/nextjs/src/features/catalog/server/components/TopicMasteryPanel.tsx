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
      className="mt-6 flex flex-col gap-3"
      data-slot="topic-mastery-panel"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl leading-snug font-medium">Topics</h2>
        {/* Names the counter column: the number is mastered-only, not answered. */}
        <p className="text-muted-foreground shrink-0 pr-3 text-sm font-medium">
          Mastered
        </p>
      </div>
      {topics.length === 0 ? (
        <div className="border-border bg-card text-muted-foreground flex flex-col gap-3 rounded-lg border p-4">
          <p>No topics for this exam yet.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {topics.map((topic) => (
            <li key={topic.topic}>
              <Link
                className="border-border bg-card hover:border-foreground/30 flex min-h-11 items-center gap-4 rounded-lg border p-3"
                href={`/${certSlug}/drill?scopeKind=TOPIC&scopeValue=${encodeURIComponent(topic.topic)}`}
              >
                <span className="flex-1 truncate text-sm">{topic.topic}</span>
                <MasteryBar
                  className="w-24"
                  mastered={topic.mastered}
                  shaky={topic.shaky}
                  total={topic.total}
                />
                <span
                  aria-label={`${topic.mastered} of ${topic.total} mastered`}
                  className="w-16 shrink-0 text-right font-mono text-sm"
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
