export const PROTECTED_ROUTES = {
  ACCOUNT: '/account',
  ACCOUNT_EDIT: '/account/edit',
  POST_CREATE: '/posts/create'
} as const

export const PUBLIC_ROUTES = {
  HOME: '/',
  POSTS: '/posts',
  CONTACT_US: '/contact'
} as const

export const PUBLIC_AUTH_ROUTES = {
  LOGIN: '/auth/login',
  CALLBACK: '/auth/callback'
} as const
