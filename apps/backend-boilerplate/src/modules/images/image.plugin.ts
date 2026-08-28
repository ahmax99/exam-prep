import { Elysia } from 'elysia'

import { ImageService } from '@/modules/images/image.service.js'

export const imagePlugin = new Elysia({ name: 'image-plugin' }).decorate({
  imageService: ImageService
})
