import { PageTemplate } from '@/components/layout'
import { AccountManagement } from '@/features/account/client/components/AccountManagement'
import { UserInfo } from '@/features/account/server/components/UserInfo'
import { PUBLIC_ROUTES } from '@/features/auth/lib/routes'
import { getMe } from '@/features/auth/server/api'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'

export const generateMetadata = () =>
  generatePageMetadata({
    title: 'Account',
    description: 'Manage your account settings'
  })

export default async function AccountPage() {
  const user = await getMe()

  return (
    <PageTemplate back={{ href: PUBLIC_ROUTES.HOME, label: 'Back to Home' }}>
      <div className="flex flex-col gap-8">
        <UserInfo user={user} />
        <AccountManagement />
      </div>
    </PageTemplate>
  )
}
