import jwt from 'jsonwebtoken'

interface InviteTokenPayload {
  teacherId: string
  exp: number
}

const isTestEnv = process.env.NODE_ENV === 'test'
const strictSecrets = process.env.E2E_STRICT_SECRETS === 'true'

const getInviteTokenSecret = () => {
  const secret = process.env.BETTER_AUTH_SECRET
  if (secret) return secret
  if (isTestEnv && !strictSecrets) return 'test-better-auth-secret'
  throw new Error('BETTER_AUTH_SECRET is required for invite tokens')
}

export const generateInviteToken = (teacherId: string): string => {
  const expirationTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
  return jwt.sign({ teacherId, exp: expirationTime }, getInviteTokenSecret())
}

export const verifyInviteToken = (token: string): InviteTokenPayload | null => {
  try {
    return jwt.verify(token, getInviteTokenSecret()) as InviteTokenPayload
  } catch {
    return null
  }
}
