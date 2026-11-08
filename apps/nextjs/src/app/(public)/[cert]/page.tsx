import { PageTemplate } from '@/components/layout'
import { RingChart, type RingSegment } from '@/components/molecules'
import { certPageParamsSchema } from '@/features/catalog/schemas/certPageParams.schema'
import {
  getQuestionMix,
  requireCertification
} from '@/features/catalog/server/api'
import { ExamList } from '@/features/catalog/server/components/ExamList'
import { TopicMasteryPanel } from '@/features/catalog/server/components/TopicMasteryPanel'
import { recommendDrill } from '@/features/drill/lib/recommendation'
import { RecommendedDrill } from '@/features/drill/server/components/RecommendedDrill'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'
import { sumMastery } from '@/features/progress/lib/mastery'
import {
  getRecentOutcomes,
  getTopicMastery,
  RECENT_OUTCOME_DAYS
} from '@/features/progress/server/api'
import { OverallMasteryCard } from '@/features/progress/server/components/OverallMasteryCard'

export const dynamic = 'force-dynamic'

interface CertificationPageProps {
  params: Promise<{ cert: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const generateMetadata = async ({ params }: CertificationPageProps) =>
  generatePageMetadata({
    title: (await requireCertification((await params).cert)).name,
    description: 'Exams, topic mastery, and recent drill outcomes.'
  })

export default async function CertificationPage({
  params,
  searchParams
}: Readonly<CertificationPageProps>) {
  const certification = await requireCertification((await params).cert)
  const cert = certification.slug
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

  const [mix, topics, outcomes] = await Promise.all([
    getQuestionMix(cert, selectedExam.code),
    getTopicMastery(cert, selectedExam.code),
    getRecentOutcomes(cert)
  ])

  const recommendation = recommendDrill({
    certSlug: cert,
    questionCount: selectedExam.questionCount,
    exams: [{ code: selectedExam.code, ...sumMastery(topics) }]
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
