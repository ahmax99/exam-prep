import { notFound } from 'next/navigation'
import { cache } from 'react'

import { PageTemplate } from '@/components/layout'
import { RingChart, type RingSegment } from '@/components/molecules'
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
import { OverallMasteryCard } from '@/features/progress/server/components/OverallMasteryCard'

export const dynamic = 'force-dynamic'

const log = logger.child({ module: 'certification-page' })

const loadCertification = cache((slug: string) =>
  catchAsyncError(getCertification(slug))
)

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
        <h1 className="text-[27px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance lg:text-[44px] lg:leading-[1.08]">
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

  const examHeading = selectedExam.title.startsWith(`Exam ${selectedExam.code}`)
    ? selectedExam.title
    : `Exam ${selectedExam.code} — ${selectedExam.title}`

  const mixSegments: RingSegment[] = [
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
  const outcomeSegments: RingSegment[] = [
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
      <h1 className="text-[27px] leading-[1.12] font-semibold tracking-[-0.03em] text-balance lg:text-[44px] lg:leading-[1.08]">
        {certification.name}
      </h1>
      <p className="mt-3.5 text-[19px] font-medium">{examHeading}</p>
      <p className="text-muted-foreground mt-2 font-mono text-[11px]">
        <span data-numeric>{selectedExam.questionCount}</span> questions ·{' '}
        <span data-numeric>{selectedExam.topicCount}</span> topics ·{' '}
        <span data-numeric>{selectedExam.objectiveCount}</span> objectives
      </p>

      <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <RecommendedDrill certSlug={cert} recommendation={recommendation} />
        <OverallMasteryCard topics={topics} />
      </div>

      <h2 className="mt-14 text-xl font-semibold tracking-tight">
        Or pick a scope
      </h2>
      <div className="mt-3.5">
        <ExamList
          certSlug={cert}
          exams={certification.exams}
          selectedCode={selectedExam.code}
        />
      </div>

      <section aria-label="Charts" className="mt-14 grid gap-5 md:grid-cols-2">
        <RingChart
          emptyMessage="No questions imported for this exam yet."
          segments={mixSegments}
          title="Question mix"
          unit="questions"
        />
        <RingChart
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
