import { notFound, redirect } from 'next/navigation'

import { DrillCard } from '@/features/drill/client/components/DrillCard'
import {
  drillRunSearchParamsSchema,
  idSchema
} from '@/features/drill/schemas/run.schema'
import { getRun } from '@/features/drill/server/api'
import { orNotFound } from '@/features/error/utils/orNotFound'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'

export const dynamic = 'force-dynamic'

export const generateMetadata = () =>
  generatePageMetadata({
    title: 'Drill',
    description: 'Answer one question at a time with immediate feedback.'
  })

interface DrillRunPageProps {
  params: Promise<{ cert: string; runId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function DrillRunPage({
  params,
  searchParams
}: DrillRunPageProps) {
  const { cert, runId } = await params
  const parsedRunId = idSchema.safeParse(runId)
  if (!parsedRunId.success) notFound()

  const parsedSearch = drillRunSearchParamsSchema.safeParse(await searchParams)
  const requestedQuestionId = parsedSearch.success
    ? parsedSearch.data.q
    : undefined

  const { run, questions, answeredQuestionIds } = await orNotFound(
    getRun(parsedRunId.data)
  )
  const answered = new Set(answeredQuestionIds)

  const requestedIndex = questions.findIndex(
    (question) =>
      question.id === requestedQuestionId && !answered.has(question.id)
  )
  const startIndex =
    requestedIndex === -1
      ? questions.findIndex((question) => !answered.has(question.id))
      : requestedIndex

  if (startIndex === -1) redirect(`/${cert}/drill/${runId}/summary`)

  const lastAnsweredIndex = questions.reduce(
    (last, question, index) => (answered.has(question.id) ? index : last),
    -1
  )
  const frontier = run.finishedAt ? questions.length : lastAnsweredIndex + 1

  const drillQuestions = questions.map((question) => ({
    id: question.id,
    objective: question.objective,
    topic: question.topic,
    type: question.type,
    prompt: question.prompt,
    options: question.options,
    timesSeen: question.progress?.timesSeen ?? 0,
    isBookmarked: question.bookmark !== null
  }))

  return (
    <main
      className="px-4 py-6 lg:px-10 lg:py-14"
      data-slot="drill-page"
      id="main-content"
      tabIndex={-1}
    >
      <div className="mx-auto w-full max-w-[1072px]">
        <DrillCard
          answeredQuestionIds={answeredQuestionIds}
          certSlug={cert}
          frontier={frontier}
          questions={drillQuestions}
          runId={runId}
          startIndex={startIndex}
        />
      </div>
    </main>
  )
}
