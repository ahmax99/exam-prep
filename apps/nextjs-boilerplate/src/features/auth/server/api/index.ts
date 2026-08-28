import type { CreateUserBody, User } from '@shared/config'

import {
  ID_TOKEN_HEADER,
  serverApiClient,
  serverAuthApiClient
} from '@/lib/serverApiClient'

export const createUser = async (data: CreateUserBody, idToken: string) =>
  serverApiClient
    .post('/users', {
      json: data,
      headers: {
        [ID_TOKEN_HEADER]: idToken
      }
    })
    .json<CreateUserBody>()

export const getMe = async () =>
  serverAuthApiClient.get('/users/me').json<User>()
