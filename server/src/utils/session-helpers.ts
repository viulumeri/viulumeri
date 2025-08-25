import type { Request, Response } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from './auth'

export const authenticateSession = async (request: Request, response: Response) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers)
  })
  if (!session) {
    response.status(401).json({ error: 'Authentication required' })
    return null
  }
  return session
}

export const requireTeacher = (session: any, response: Response) => {
  if (session.user?.userType !== 'teacher') {
    response.status(403).json({ error: 'Teacher role required' })
    return false
  }
  return true
}

export const requireStudent = (session: any, response: Response) => {
  if (session.user?.userType !== 'student') {
    response.status(403).json({ error: 'Student role required' })
    return false
  }
  return true
}