import type { SessionOptions } from 'iron-session'

import { env } from '@/config/env'

import { COOKIE_OPTIONS, PKCE_COOKIE_OPTIONS } from './cookie'

export const SESSION_CONFIG = {
  password: env.SESSION_SECRET,
  cookieName: 'auth_session',
  cookieOptions: COOKIE_OPTIONS
} as SessionOptions

export const PKCE_CONFIG = {
  password: env.SESSION_SECRET,
  cookieName: 'auth_pkce',
  cookieOptions: PKCE_COOKIE_OPTIONS
} as SessionOptions
