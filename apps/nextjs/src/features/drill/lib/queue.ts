import type { StartRunInput } from '@/features/drill/schemas/startRun.schema'
import { AppError } from '@/features/error/lib/AppError'
import type { MasteryState, Prisma } from '@/lib/prisma'

type ScopeInput = Pick<StartRunInput, 'scopeKind' | 'scopeValue' | 'certSlug'>

const requireScopeValue = (scopeKind: string, scopeValue: string): string => {
  if (scopeValue.length === 0)
    throw new AppError(
      'BAD_REQUEST',
      `scopeValue is required for scopeKind "${scopeKind}"`
    )
  return scopeValue
}

const SCOPE_WHERE_BUILDERS: Record<
  StartRunInput['scopeKind'],
  (scopeValue: string, certSlug: string) => Prisma.QuestionWhereInput
> = {
  CERT: (_scopeValue, certSlug) => ({
    exam: { certification: { slug: certSlug } }
  }),
  EXAM: (scopeValue, certSlug) => ({
    exam: {
      code: requireScopeValue('EXAM', scopeValue),
      certification: { slug: certSlug }
    }
  }),
  TOPIC: (scopeValue, certSlug) => ({
    topic: requireScopeValue('TOPIC', scopeValue),
    exam: { certification: { slug: certSlug } }
  }),
  OBJECTIVE: (scopeValue, certSlug) => ({
    objective: requireScopeValue('OBJECTIVE', scopeValue),
    exam: { certification: { slug: certSlug } }
  }),
  MISSED: (_scopeValue, certSlug) => ({
    progress: { state: 'WRONG' },
    exam: { certification: { slug: certSlug } }
  }),
  UNSEEN: (_scopeValue, certSlug) => ({
    progress: { is: null },
    exam: { certification: { slug: certSlug } }
  }),
  BOOKMARKS: (_scopeValue, certSlug) => ({
    bookmark: { isNot: null },
    exam: { certification: { slug: certSlug } }
  })
}

export const buildScopeWhere = ({
  scopeKind,
  scopeValue,
  certSlug
}: ScopeInput): Prisma.QuestionWhereInput =>
  SCOPE_WHERE_BUILDERS[scopeKind](scopeValue, certSlug)

export interface QueueCandidate {
  id: string
  progress: { state: MasteryState } | null
}

export const orderQueue = (
  candidates: QueueCandidate[],
  limit: number
): string[] => {
  const wrong = candidates.filter((c) => c.progress?.state === 'WRONG')
  const unseen = candidates.filter((c) => c.progress === null)
  const shaky = candidates.filter((c) => c.progress?.state === 'SHAKY')
  const mastered = candidates.filter((c) => c.progress?.state === 'MASTERED')

  const preferred = [...wrong, ...unseen, ...shaky]
  const ordered =
    preferred.length >= limit ? preferred : [...preferred, ...mastered]

  return ordered.slice(0, limit).map((candidate) => candidate.id)
}
