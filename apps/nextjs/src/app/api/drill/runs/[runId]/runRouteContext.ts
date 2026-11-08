import { idSchema } from '@/features/drill/schemas/run.schema'
import { parseInput } from '@/lib/requestInput'

export interface RunRouteContext {
  params: Promise<{ runId: string }>
}

export const parseRunId = async ({ params }: RunRouteContext) =>
  parseInput(idSchema, (await params).runId, 'Invalid run id')
