import type { DrillLauncherParams } from '@/features/drill/schemas/drillLauncherParams.schema'

type DrillHrefParams = Pick<DrillLauncherParams, 'scopeKind'> &
  Partial<Pick<DrillLauncherParams, 'scopeValue' | 'limit' | 'fresh'>>

export const drillHref = (
  certSlug: string,
  { scopeKind, scopeValue = '', limit, fresh }: DrillHrefParams
) => {
  const query = [
    `scopeKind=${scopeKind}`,
    `scopeValue=${encodeURIComponent(scopeValue)}`
  ]
  if (limit !== undefined) query.push(`limit=${limit}`)
  if (fresh) query.push('fresh=1')

  return `/${certSlug}/drill?${query.join('&')}`
}
