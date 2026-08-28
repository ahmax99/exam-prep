import {
  calculatePKCECodeChallenge,
  randomPKCECodeVerifier,
  randomState
} from 'openid-client'

export const generatePKCE = async () => {
  const codeVerifier = randomPKCECodeVerifier()
  const codeChallenge = await calculatePKCECodeChallenge(codeVerifier)

  return {
    codeVerifier,
    codeChallenge
  }
}

export const generateState = () => randomState()

export const generateNonce = () => randomState()
