export const COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/'
}

export const PKCE_COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: 60 * 10, // 10 minutes — abandoned login flows self-expire
  path: '/'
}
