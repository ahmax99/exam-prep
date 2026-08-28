import { Suspense } from 'react'

import { OAuth2Start } from '@/features/auth/client/components/OAuth2Start'

export default function LoginPage() {
  return (
    <Suspense>
      <OAuth2Start />
    </Suspense>
  )
}
