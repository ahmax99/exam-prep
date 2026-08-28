import { Elysia } from 'elysia'

import { CommentService } from '@/modules/comments/comment.service.js'
import { UserService } from '@/modules/users/user.service.js'

export const commentPlugin = new Elysia({ name: 'comment-plugin' }).decorate({
  commentService: CommentService,
  userService: UserService
})
