import { PageTemplate } from '@/components/layout'
import {
  AccountForm,
  type FieldConfig
} from '@/features/account/client/components/AccountForm'
import { PROTECTED_ROUTES } from '@/features/auth/lib/routes'
import { getMe } from '@/features/auth/server/api'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'

export const generateMetadata = () =>
  generatePageMetadata({
    title: 'Edit Profile',
    description: 'Update your profile information'
  })

export default async function EditAccountPage() {
  const user = await getMe()

  const updateProfileConfig = {
    title: 'Update Profile',
    description: 'Update your profile information',
    submitLabel: 'Update Profile',
    defaultValues: {
      name: user.name,
      image: user.imagePath
    },
    fields: [
      {
        name: 'name' as FieldConfig['name'],
        label: 'Name',
        description: 'Enter your name'
      },
      {
        name: 'image' as FieldConfig['name'],
        label: 'Profile Picture',
        description: 'Upload your profile picture'
      }
    ]
  }
  return (
    <PageTemplate
      back={{ href: PROTECTED_ROUTES.ACCOUNT, label: 'Back to Account' }}
    >
      <div className="flex w-full flex-col items-center justify-center">
        <AccountForm config={updateProfileConfig} />
      </div>
    </PageTemplate>
  )
}
