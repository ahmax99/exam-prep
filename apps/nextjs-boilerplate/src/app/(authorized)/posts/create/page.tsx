import { redirect } from 'next/navigation'

import { PageTemplate } from '@/components/layout'
import { ADMIN_ONLY_FORBIDDEN_MESSAGE } from '@/features/auth/constants/toastMessages'
import { getUserPermissions } from '@/features/auth/lib/permission'
import { PUBLIC_ROUTES } from '@/features/auth/lib/routes'
import { getMe } from '@/features/auth/server/api'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'
import {
  type FieldConfig,
  PostForm
} from '@/features/post/client/components/PostForm'

export const generateMetadata = () =>
  generatePageMetadata({
    title: 'Create Post',
    description: 'Share your thoughts with the big world'
  })

export default async function CreatePostPage() {
  const user = await getMe()
  if (!getUserPermissions(user).can('create', 'Post'))
    redirect(`${PUBLIC_ROUTES.HOME}?error=${ADMIN_ONLY_FORBIDDEN_MESSAGE}`)

  const createPostConfig = {
    title: 'Create Post',
    description: 'Share your thoughts with the big world',
    submitLabel: 'Create Post',
    defaultValues: {
      title: '',
      content: '',
      image: ''
    },
    fields: [
      {
        name: 'title' as FieldConfig['name'],
        label: 'Title',
        description: 'Enter your post title'
      },
      {
        name: 'content' as FieldConfig['name'],
        label: 'Content',
        description: 'Enter your post content'
      },
      {
        name: 'image' as FieldConfig['name'],
        label: 'Image',
        description: 'Enter your post image'
      }
    ]
  }

  return (
    <PageTemplate alignment="center">
      <PostForm config={createPostConfig} user={user} />
    </PageTemplate>
  )
}
