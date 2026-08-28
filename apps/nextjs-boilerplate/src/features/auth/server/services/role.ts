import { AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider'
import { COGNITO_GROUPS, type User } from '@shared/config'

import { env } from '@/config/env'
import { cognitoClient } from '@/lib/cognito'

export const assignDefaultRoleGroup = async (sub: User['cognitoSub']) =>
  await cognitoClient.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: env.COGNITO_USERPOOL_ID,
      Username: sub,
      GroupName: COGNITO_GROUPS.USERS
    })
  )
