import { notFound, redirect } from 'next/navigation'

import { logger } from '@/config/logger'
import { DrillCard } from '@/features/drill/client/components/DrillCard'
import { idSchema } from '@/features/drill/schemas/run.schema'
import { getRun } from '@/features/drill/server/api'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'

export const dynamic = 'force-dynamic'

const log = logger.child({ module: 'drill-page' })

// Hoisted so the success and error branches can't drift apart.
const drillMainClassName = 'px-4 py-6 lg:flex lg:min-h-dvh lg:justify-center'

export const generateMetadata = () =>
  generatePageMetadata({
    title: 'Drill',
    description: 'Answer one question at a time with immediate feedback.'
  })

interface DrillRunPageProps {
  params: Promise<{ cert: string; runId: string }>
}

export default async function DrillRunPage({ params }: DrillRunPageProps) {
  const { cert, runId } = await params
  const parsedRunId = idSchema.safeParse(runId)
  if (!parsedRunId.success) notFound()

  const result = await getRun(parsedRunId.data)

  return result.match(
    ({ questions, answeredQuestionIds }) => {
      const answered = new Set(answeredQuestionIds)
      const startIndex = questions.findIndex(
        (question) => !answered.has(question.id)
      )

      if (startIndex === -1) redirect(`/${cert}/drill/${runId}/summary`)

      const drillQuestions = questions.map((question) => ({
        id: question.id,
        objective: question.objective,
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
          <div className="mx-auto w-full max-w-[40rem] lg:my-auto xl:max-w-[67rem]">
            <DrillCard
              certSlug={cert}
              questions={drillQuestions}
              runId={runId}
              startIndex={startIndex}
            />
          </div>
        </main>
      )
    },
    (error) => {
      // A well-formed but nonexistent runId is a real 404, not a transient
      // failure a refresh could fix.
      if (error.code === 'NOT_FOUND') notFound()

      log.error({ error, runId }, 'Failed to load drill run')
      return (
        <main
          className={drillMainClassName}
          data-slot="drill-page"
          id="main-content"
          tabIndex={-1}
        >
          <div className="mx-auto w-full max-w-[40rem] lg:my-auto">
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
