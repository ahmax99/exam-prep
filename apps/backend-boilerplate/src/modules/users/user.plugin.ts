import { Elysia } from 'elysia'

import { UploadService } from '@/modules/upload/upload.service.js'
import { UserService } from '@/modules/users/user.service.js'

export const userPlugin = new Elysia({ name: 'user-plugin' }).decorate({
  userService: UserService,
  uploadService: UploadService
})
