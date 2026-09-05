import { notFound, redirect } from 'next/navigation'

import { logger } from '@/config/logger'
import { DrillCard } from '@/features/drill/client/components/DrillCard'
import {
  drillRunSearchParamsSchema,
  idSchema
} from '@/features/drill/schemas/run.schema'
import { getRun } from '@/features/drill/server/api'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'

export const dynamic = 'force-dynamic'

const log = logger.child({ module: 'drill-page' })

const drillMainClassName = 'px-4 py-6 lg:px-8 lg:py-14'

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

  const result = await getRun(parsedRunId.data)

  return result.match(
    ({ run, questions, answeredQuestionIds }) => {
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
          className={drillMainClassName}
          data-slot="drill-page"
          id="main-content"
          tabIndex={-1}
        >
          <div className="mx-auto w-full max-w-[40rem] xl:max-w-[67rem]">
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
    },
    (error) => {
      if (error.code === 'NOT_FOUND') notFound()

      log.error({ error, runId }, 'Failed to load drill run')
      return (
        <main
          className={drillMainClassName}
          data-slot="drill-page"
          id="main-content"
          tabIndex={-1}
        >
          <div className="mx-auto w-full max-w-[40rem]">
            <h1 className="sr-only">Drill</h1>
            <p className="text-muted-foreground">
              Something went wrong loading this run. Try refreshing.
            </p>
          </div>
        </main>
      )
    }
  )
}
