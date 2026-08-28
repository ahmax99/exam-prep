import Image from 'next/image'

import type { Comment, Post } from '@shared/config'

import { Separator } from '@/components/atoms'
import { CommentSection } from '@/features/comment/server/components/CommentSection'

import { DeletePostButton } from '../../client/components/DeletePostButton'

interface PostDetailProps {
  post: Post
  comments: Comment[]
  postImage: string
}

export const PostDetail = async ({
  post,
  comments,
  postImage
}: PostDetailProps) => (
  <>
    <div className="relative mb-8 h-100 w-full overflow-hidden rounded-xl shadow-sm">
      <Image
        alt={post.title}
        className="object-cover"
        fill
        loading="eager"
        sizes="100vw"
        src={postImage}
        unoptimized
      />
    </div>

    <div className="flex flex-col space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-foreground text-4xl font-bold tracking-tight">
          {post.title}
        </h1>

        <DeletePostButton post={post} />
      </div>

      <div className="flex items-center gap-2">
        <p className="text-muted-foreground text-sm">
          Posted on: {new Date(post.createdAt).toLocaleDateString('en-US')}
        </p>
      </div>
    </div>

    <Separator className="my-8" />

    <p className="text-foreground/90 text-lg leading-relaxed whitespace-pre-wrap">
      {post.content}
    </p>

    <Separator className="my-8" />

    <CommentSection comments={comments} postId={post.id} />
  </>
)
