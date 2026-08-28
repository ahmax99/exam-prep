import type { Comment, PostIdParams } from '@shared/config'
import { MessageSquare } from 'lucide-react'

import { Separator } from '@/components/atoms'
import {
  Avatar,
  AvatarImage,
  Card,
  CardContent,
  CardHeader
} from '@/components/molecules'
import { env } from '@/config/env'

import {
  CommentForm,
  type CommentFormConfig
} from '../../client/components/CommentForm'
import { DeleteCommentButton } from '../../client/components/DeleteCommentButton'

interface CommentSectionProps {
  postId: PostIdParams['id']
  comments: Comment[]
}

export const CommentSection = async ({
  postId,
  comments
}: CommentSectionProps) => {
  const commentFormConfig: CommentFormConfig = {
    fields: [
      {
        name: 'content',
        label: 'Comment',
        description: 'Share your thoughts'
      }
    ],
    submitLabel: 'Post Comment',
    defaultValues: { content: '', postId }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 border-b">
        <MessageSquare className="size-5" />
        <h2 className="text-xl font-bold">
          {comments.length} {comments.length <= 1 ? 'Comment' : 'Comments'}
        </h2>
      </CardHeader>

      <CardContent className="space-y-8">
        <CommentForm config={commentFormConfig} />

        {comments.length > 0 && <Separator />}

        <section className="space-y-6">
          {comments.map((comment) => (
            <div className="flex gap-4" key={comment.id}>
              <Avatar className="size-10 shrink-0">
                <AvatarImage
                  alt={comment.author?.name}
                  src={
                    comment.author?.imagePath
                      ? `${env.BASE_URL}/api/v1/images/${comment.author.imagePath}`
                      : `https://avatar.vercel.sh/${comment.authorId}`
                  }
                />
              </Avatar>
              <div className="flex flex-1 justify-between space-y-1">
                <div className="flex flex-col">
                  <p className="text-sm font-semibold">
                    {comment.author?.name}
                  </p>
                  <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <p className="text-muted-foreground text-xs">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                  <DeleteCommentButton commentId={comment.id} />
                </div>
              </div>
            </div>
          ))}
        </section>
      </CardContent>
    </Card>
  )
}
