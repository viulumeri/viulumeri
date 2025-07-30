import { createAuthClient } from 'better-auth/react'

const getBaseURL = () => {
  if (import.meta.env.DEV) {
    // Vite-specific env variable, set based on build mode, true when started with npm run dev
    // better auth wants the full url so that's why this is here.
    return 'http://localhost:3001/api/auth'
  }
  return '/api/auth'
}

export const authClient = createAuthClient({
  baseURL: getBaseURL()
})
