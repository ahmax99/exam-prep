'use client'

import { ActionButton } from '@/components/organisms'

type ActionResult = { error: null } | { error: { message: string } }

interface AuthActionButtonProps extends Omit<
  React.ComponentProps<typeof ActionButton>,
  'action'
> {
  action: () => Promise<ActionResult>
  successMessage?: string
}

const handleAuthAction = async (
  action: AuthActionButtonProps['action'],
  successMessage?: string
) => {
  const result = await action()

  if (result.error)
    return {
      error: true,
      message: result.error.message ?? 'Action failed'
    }

  return { error: false, message: successMessage }
}

export const AuthActionButton = ({
  action,
  successMessage,
  ...props
}: Readonly<AuthActionButtonProps>) => (
  <ActionButton
    {...props}
    action={async () => handleAuthAction(action, successMessage)}
  />
)
