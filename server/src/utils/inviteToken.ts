import jwt from 'jsonwebtoken'

interface InviteTokenPayload {
  teacherId: string
  exp: number
}

const SECRET = process.env.BETTER_AUTH_SECRET
if (!SECRET) {
  throw new Error('BETTER_AUTH_SECRET is required for invite tokens')
}

export const generateInviteToken = (teacherId: string): string => {
  const expirationTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
  return jwt.sign({ teacherId, exp: expirationTime }, SECRET)
}

export const verifyInviteToken = (token: string): InviteTokenPayload | null => {
  try {
    return jwt.verify(token, SECRET) as InviteTokenPayload
  } catch {
    return null
  }
}
