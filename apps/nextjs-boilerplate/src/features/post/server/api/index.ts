import type { Post, UploadImageQuery } from '@shared/config'

import { serverApiClient, serverAuthApiClient } from '@/lib/serverApiClient'

export const fetchAllPosts = async () =>
  serverApiClient.get('posts').json<Post[]>()

export const fetchPost = async (id: Post['id']) =>
  serverApiClient.get(`posts/${id}`).json<Post>()

export const fetchPreSignedUrl = async (query: UploadImageQuery) =>
  serverAuthApiClient
    .get('posts/presigned-url', { searchParams: query })
    .json<{ presignedUrl: string; publicUrl: string; key: string }>()

export const createPostServer = async (post: Post) =>
  serverAuthApiClient.post('posts', { json: post }).json<Post>()

export const deletePostServer = async (id: Post['id']) =>
  serverAuthApiClient.delete(`posts/${id}`).json()
