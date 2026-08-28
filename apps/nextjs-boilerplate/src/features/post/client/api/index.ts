import type { CreatePostBody, Post } from '@shared/config'

import { apiClient } from '@/lib/apiClient'

import { PLACEHOLDER_IMAGE_URL } from '../../constants'

export const fetchPostImage = (imagePath: string) => {
  if (!imagePath) return PLACEHOLDER_IMAGE_URL

  return `/api/images?path=${encodeURIComponent(imagePath)}`
}

export const createPostClient = async (input: CreatePostBody) =>
  apiClient.post('posts', { json: input }).json<Post>()

export const deletePostClient = async (id: Post['id']) =>
  apiClient.delete(`posts/${id}`).json()

export const uploadImage = async (file: File) => {
  const { presignedUrl, publicUrl, key } = await apiClient
    .get('posts/presigned-url', {
      searchParams: {
        filename: file.name,
        contentType: file.type
      }
    })
    .json<{ presignedUrl: string; publicUrl: string; key: string }>()

  const uploadResponse = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  })

  return { uploadResponse, publicUrl, key }
}
