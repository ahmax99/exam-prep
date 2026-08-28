import { Elysia } from 'elysia'

import { PostService } from '@/modules/posts/post.service.js'
import { UploadService } from '@/modules/upload/upload.service.js'
import { UserService } from '@/modules/users/user.service.js'

export const postPlugin = new Elysia({ name: 'post-plugin' }).decorate({
  postService: PostService,
  uploadService: UploadService,
  userService: UserService
})
