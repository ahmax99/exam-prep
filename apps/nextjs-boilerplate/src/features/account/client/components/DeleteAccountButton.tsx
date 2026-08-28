'use client'

import { AuthActionButton } from '@/features/auth/client/components/AuthActionButton'

import { useAccountActions } from '../hooks/useAccountActions'

export const DeleteAccountButton = () => {
  const { handleDeleteAccount } = useAccountActions()

  return (
    <AuthActionButton
      action={() => handleDeleteAccount()}
      requireAreYouSure
      variant="destructive"
    >
      Delete Account Permanently
    </AuthActionButton>
  )
}
