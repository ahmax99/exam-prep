import Image from 'next/image'

import type { Post } from '@shared/config'
import { Newspaper } from 'lucide-react'

import { ButtonLink } from '@/components/atoms'
import { Card, CardContent, CardFooter } from '@/components/molecules'

interface PostsListProps {
  posts: Post[]
  imageUrls: string[]
}

export const PostsList = async ({ posts, imageUrls }: PostsListProps) => {
  if (!posts || posts.length === 0)
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <Newspaper className="text-muted-foreground size-10" />
        <h2 className="text-xl font-semibold">No posts yet</h2>
        <p className="text-muted-foreground">
          Check back soon for new articles.
        </p>
      </div>
    )

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post, index) => (
        <Card className="pt-0" key={post.id}>
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              alt="image"
              className="rounded-t-lg object-cover"
              fill
              loading="eager"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              src={imageUrls[index] ?? ''}
              unoptimized
            />
          </div>

          <CardContent>
            <h1 className="hover:text-primary text-2xl font-bold">
              {post.title}
            </h1>
            <p className="text-muted-foreground line-clamp-3">{post.content}</p>
          </CardContent>
          <CardFooter>
            <ButtonLink className="w-full" href={`/posts/${post.id}`}>
              Read more
            </ButtonLink>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
