import Link from 'next/link'

import { MasteryBar } from '@/components/atoms'
import type { TopicMastery } from '@/features/progress/server/api'

interface TopicMasteryPanelProps {
  certSlug: string
  topics: TopicMastery[]
}

function TopicMasteryPanel({
  certSlug,
  topics
}: Readonly<TopicMasteryPanelProps>) {
  return (
    <section
      aria-label="Topics"
      className="mt-6 flex flex-col gap-3"
      data-slot="topic-mastery-panel"
    >
      <h2 className="text-lg font-semibold">Topics</h2>
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
                <span className="flex-1 truncate font-mono text-sm">
                  {topic.topic}
                </span>
                <MasteryBar
                  className="w-24"
                  mastered={topic.mastered}
                  shaky={topic.shaky}
                  total={topic.total}
                />
                <span className="w-16 shrink-0 text-right font-mono text-sm">
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
