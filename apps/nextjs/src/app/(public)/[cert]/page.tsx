import { notFound } from 'next/navigation'
import { cache } from 'react'

import { PageTemplate } from '@/components/layout'
import { DoughnutChart, type DoughnutSegment } from '@/components/molecules'
import { logger } from '@/config/logger'
import {
  certPageParamsSchema,
  certSlugSchema
} from '@/features/catalog/schemas/certPageParams.schema'
import { getCertification, getQuestionMix } from '@/features/catalog/server/api'
import { ExamList } from '@/features/catalog/server/components/ExamList'
import { TopicMasteryPanel } from '@/features/catalog/server/components/TopicMasteryPanel'
import { recommendDrill } from '@/features/drill/lib/recommendation'
import { RecommendedDrill } from '@/features/drill/server/components/RecommendedDrill'
import { catchAsyncError } from '@/features/error/utils/catchError'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'
import {
  getDashboard,
  getRecentOutcomes,
  getTopicMastery,
  RECENT_OUTCOME_DAYS
} from '@/features/progress/server/api'

export const dynamic = 'force-dynamic'

const log = logger.child({ module: 'certification-page' })

// Dedupes the certification read across `generateMetadata` and the render —
// two calls, one pair of statements.
const loadCertification = cache((slug: string) =>
  catchAsyncError(getCertification(slug))
)

// The `[cert]` segment reaches four separate `server/api` reads below; reject
// a shape that can't match a row before any of them run.
const parseCertSlug = (cert: string) => {
  const result = certSlugSchema.safeParse(cert)
  if (!result.success) notFound()
  return result.data
}

interface CertificationPageProps {
  params: Promise<{ cert: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const generateMetadata = async ({ params }: CertificationPageProps) => {
  const cert = parseCertSlug((await params).cert)
  const result = await loadCertification(cert)

  if (result.isErr() && result.error.code !== 'NOT_FOUND') {
    log.error(
      { error: result.error, certSlug: cert },
      'Failed to load certification for metadata'
    )
  }

  return generatePageMetadata({
    title: result.isOk() ? result.value.name : 'Certification',
    description: 'Exams, topic mastery, and recent drill outcomes.'
  })
}

export default async function CertificationPage({
  params,
  searchParams
}: Readonly<CertificationPageProps>) {
  const cert = parseCertSlug((await params).cert)
  const result = await loadCertification(cert)

  if (result.isErr()) {
    if (result.error.code === 'NOT_FOUND') notFound()

    log.error(
      { error: result.error, certSlug: cert },
      'Failed to load certification'
    )
    return (
      <PageTemplate>
        <p className="text-muted-foreground">
          Something went wrong loading this certification. Try refreshing.
        </p>
      </PageTemplate>
    )
  }

  const certification = result.value
  const { exam } = certPageParamsSchema.parse(await searchParams)
  const selectedExam =
    certification.exams.find((candidate) => candidate.code === exam) ??
    certification.exams[0]

  if (!selectedExam) {
    return (
      <PageTemplate>
        <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance md:text-5xl">
          {certification.name}
        </h1>
        <p className="text-muted-foreground mt-4">No exams seeded yet.</p>
      </PageTemplate>
    )
  }

  const [mix, topics, outcomes, dashboard] = await Promise.all([
    catchAsyncError(getQuestionMix(cert, selectedExam.code)).match(
      (value) => value,
      (error) => {
        log.error({ error, certSlug: cert }, 'Failed to load question mix')
        return { fillIn: 0, singleAnswer: 0, multipleAnswer: 0 }
      }
    ),
    catchAsyncError(getTopicMastery(cert, selectedExam.code)).match(
      (value) => value,
      (error) => {
        log.error({ error, certSlug: cert }, 'Failed to load topic mastery')
        return []
      }
    ),
    catchAsyncError(getRecentOutcomes(cert)).match(
      (value) => value,
      (error) => {
        log.error({ error, certSlug: cert }, 'Failed to load recent outcomes')
        return { rightFirstTry: 0, selfGraded: 0, missed: 0 }
      }
    ),
    catchAsyncError(getDashboard()).match(
      (value) => value,
      (error) => {
        log.error({ error, certSlug: cert }, 'Failed to load dashboard')
        return []
      }
    )
  ])

  const mastery = dashboard.find((entry) => entry.slug === cert)
  const recommendation = recommendDrill({
    certSlug: cert,
    missed: mastery?.missed ?? 0,
    unseen: mastery?.unseen ?? 0,
    questionCount: selectedExam.questionCount,
    examCode: selectedExam.code,
    examQuestionCount: selectedExam.questionCount
  })

  // Seeded titles already lead with their own code ("Exam 101 Mixed") — only
  // prefix one that doesn't.
  const examHeading = selectedExam.title.startsWith(`Exam ${selectedExam.code}`)
    ? selectedExam.title
    : `Exam ${selectedExam.code} — ${selectedExam.title}`

  const mixSegments: DoughnutSegment[] = [
    {
      label: 'fill in the blank',
      value: mix.fillIn,
      color: 'var(--chart-fill-in)'
    },
    {
      label: 'single answer',
      value: mix.singleAnswer,
      color: 'var(--chart-single)'
    },
    {
      label: 'multiple answer',
      value: mix.multipleAnswer,
      color: 'var(--chart-multiple)'
    }
  ]
  const outcomeSegments: DoughnutSegment[] = [
    {
      label: 'right first try',
      value: outcomes.rightFirstTry,
      color: 'var(--chart-correct)'
    },
    {
      label: 'self-graded as known',
      value: outcomes.selfGraded,
      color: 'var(--chart-self-graded)'
    },
    { label: 'missed', value: outcomes.missed, color: 'var(--chart-missed)' }
  ]

  return (
    <PageTemplate>
      <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance md:text-5xl">
        {certification.name}
      </h1>
      <div className="mt-3 flex flex-col gap-1">
        <h2 className="text-xl leading-snug font-medium">{examHeading}</h2>
        <p className="text-muted-foreground text-sm">
          <span className="font-mono" data-numeric>
            {selectedExam.questionCount}
          </span>{' '}
          questions across{' '}
          <span className="font-mono" data-numeric>
            {selectedExam.topicCount}
          </span>{' '}
          topics ·{' '}
          <span className="font-mono" data-numeric>
            {selectedExam.objectiveCount}
          </span>{' '}
          objectives
        </p>
      </div>

      <div className="mt-8">
        <RecommendedDrill certSlug={cert} recommendation={recommendation} />
      </div>

      <div className="mt-12">
        <h2 className="border-border border-b pb-2 text-xl leading-snug font-medium">
          Or pick a scope
        </h2>
        <div className="mt-4">
          <ExamList
            certSlug={cert}
            exams={certification.exams}
            selectedCode={selectedExam.code}
          />
        </div>
      </div>

      <section aria-label="Charts" className="mt-12 grid gap-8 md:grid-cols-2">
        <DoughnutChart
          emptyMessage="No questions imported for this exam yet."
          segments={mixSegments}
          title="Question mix"
          unit="questions"
        />
        <DoughnutChart
          emptyMessage={`No answers in the last ${RECENT_OUTCOME_DAYS} days`}
          segments={outcomeSegments}
          title={`Last ${RECENT_OUTCOME_DAYS} days`}
          unit="answers"
        />
      </section>

      <TopicMasteryPanel certSlug={cert} topics={topics} />
    </PageTemplate>
  )
}
