import { type NextRequest, NextResponse } from 'next/server'

import { createPostServer, fetchAllPosts } from '@/features/post/server/api'
import { withRequestLogging } from '@/lib/requestLogging'

export const GET = withRequestLogging(async () => {
  const response = await fetchAllPosts()

  return NextResponse.json(response, { status: 200 })
})

export const POST = withRequestLogging(async (request: NextRequest) => {
  const body = await request.json()

  const response = await createPostServer(body)

  return NextResponse.json(response, { status: 201 })
})
