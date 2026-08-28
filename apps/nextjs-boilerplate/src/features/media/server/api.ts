import { serverApiClient } from '@/lib/serverApiClient'

export const fetchImage = (imagePath: string) =>
  serverApiClient.get(`images/${imagePath}`)
