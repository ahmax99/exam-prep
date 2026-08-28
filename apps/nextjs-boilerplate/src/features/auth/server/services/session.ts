'use server'

import { cookies } from 'next/headers'

import { getIronSession } from 'iron-session'

import { PKCE_CONFIG, SESSION_CONFIG } from '../../constants/session'
import type { PKCEData, SessionData } from '../../schemas/auth.schema'

export const getSession = async () => {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, SESSION_CONFIG)

  return session
}

export const setSessionData = async (data: SessionData) => {
  const session = await getSession()

  Object.assign(session, data)

  await session.save()
}

export const getSessionData = async () => {
  const session = await getSession()

  return {
    refreshToken: session.refreshToken
  }
}

export const destroySession = async () => {
  const session = await getSession()

  session.destroy()
}

const getPKCESession = async () => {
  const cookieStore = await cookies()
  const session = await getIronSession<PKCEData>(cookieStore, PKCE_CONFIG)

  return session
}

export const setPKCEData = async (data: PKCEData) => {
  const session = await getPKCESession()

  Object.assign(session, data)

  await session.save()
}

export const getPKCEData = async () => {
  const session = await getPKCESession()

  return {
    codeVerifier: session.codeVerifier,
    state: session.state,
    nonce: session.nonce,
    callbackUrl: session.callbackUrl
  }
}

export const destroyPKCESession = async () => {
  const session = await getPKCESession()

  session.destroy()
}
