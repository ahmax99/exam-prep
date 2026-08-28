import { Suspense } from 'react'

import { PageHeader } from '@/components/layout'
import { AbilityProvider } from '@/features/auth/client/providers/PermissionProvider'
import { getUserPermissions } from '@/features/auth/lib/permission'
import { getMe } from '@/features/auth/server/api'
import { getSessionData } from '@/features/auth/server/services/session'
import { ErrorScreenProvider } from '@/features/error/client/providers/ErrorScreenProvider'
import { catchAsyncError } from '@/features/error/utils/catchError'

async function PublicLayoutContent({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSessionData()

  const user = session.refreshToken
    ? (await catchAsyncError(getMe())).unwrapOr(undefined)
    : undefined

  const rules = getUserPermissions(user).rules

  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense -- AbilityProvider is already wrapped in <Suspense> below (see .react-doctor/false-positives.md)
  return <AbilityProvider rules={rules}>{children}</AbilityProvider>
}

export default function PublicLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ErrorScreenProvider />
      <Suspense>
        <PageHeader />
      </Suspense>
      <Suspense>
        <PublicLayoutContent>{children}</PublicLayoutContent>
      </Suspense>
    </>
  )
}
