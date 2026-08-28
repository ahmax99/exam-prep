import type { PostIdParams } from '@shared/config'

import { PageTemplate } from '@/components/layout'
import { PUBLIC_ROUTES } from '@/features/auth/lib/routes'
import { fetchAllComments } from '@/features/comment/server/api'
import { generatePageMetadata } from '@/features/metadata/utils/generatePageMetadata'
import { fetchPostImage } from '@/features/post/client/api'
import { fetchPost } from '@/features/post/server/api'
import { PostDetail } from '@/features/post/server/components/PostDetail'

interface PostDetailPageProps {
  params: Promise<{ postId: PostIdParams['id'] }>
}

export async function generateMetadata({ params }: PostDetailPageProps) {
  const { postId } = await params

  const post = await fetchPost(postId)

  return generatePageMetadata({
    title: post.title,
    description: post.content
  })
}

export default async function PostDetailPage({
  params
}: Readonly<PostDetailPageProps>) {
  const { postId } = await params

  const [post, comments] = await Promise.all([
    fetchPost(postId),
    fetchAllComments(postId)
  ])
  const postImage = fetchPostImage(post.imagePath ?? '')

  return (
    <PageTemplate
      back={{ href: PUBLIC_ROUTES.POSTS, label: 'Back to posts' }}
      maxWidth="wide"
    >
      <PostDetail comments={comments} post={post} postImage={postImage} />
    </PageTemplate>
  )
}
