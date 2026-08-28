import type { UpdateUserBody } from '@shared/config'

import { PLACEHOLDER_IMAGE_URL } from '@/features/post/constants'
import { apiClient } from '@/lib/apiClient'

export const fetchProfileImage = (imagePath: string) => {
  if (!imagePath) return PLACEHOLDER_IMAGE_URL

  return `/api/images?path=${encodeURIComponent(imagePath)}`
}

export const updateUser = async (data: UpdateUserBody) =>
  apiClient.put('account', { json: data }).json()

export const uploadProfileImage = async (file: File) => {
  const { presignedUrl, publicUrl, key } = await apiClient
    .get('account/presigned-url', {
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

export const deleteUser = async () => apiClient.delete('account').json()
