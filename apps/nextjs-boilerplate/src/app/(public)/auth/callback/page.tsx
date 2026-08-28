import { Suspense } from 'react'

import { OAuth2Callback } from '@/features/auth/client/components/OAuth2Callback'

export default function CallbackPage() {
  return (
    <Suspense>
      <OAuth2Callback />
    </Suspense>
  )
}
