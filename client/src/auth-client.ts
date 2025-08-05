import { createAuthClient } from 'better-auth/react'

const getBaseURL = () => {
  // Use window.location.origin to get the current origin
  // In dev: http://localhost:5173, in prod: your domain
  return `${window.location.origin}/api/auth`
}

export const authClient = createAuthClient({
  baseURL: getBaseURL()
})

export const { useSession } = authClient
