import { LogOut } from 'lucide-react'

import { ButtonLink } from '@/components/atoms'

export const LogoutButton = () => (
  <ButtonLink
    href="/api/auth/logout"
    prefetch={false}
    size="sm"
    variant="outline"
  >
    Sign Out
    <LogOut className="h-4 w-4" />
  </ButtonLink>
)
