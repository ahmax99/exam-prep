import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { createComment, fetchAllComments } from '@/features/comment/server/api'
import { withRequestLogging } from '@/lib/requestLogging'

export const GET = withRequestLogging(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl
  const postId = searchParams.get('postId')

  const response = await fetchAllComments(postId ?? '')

  return NextResponse.json(response, { status: 200 })
})

export const POST = withRequestLogging(async (request: NextRequest) => {
  const body = await request.json()

  const comment = await createComment(body)

  return NextResponse.json(comment, { status: 201 })
})
