import { Router, type Request, type Response } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../utils/auth'
import Teacher from '../models/teacher'

const teacherRouter = Router()

const authenticateSession = async (request: Request, response: Response) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers)
  })

  if (!session) {
    response.status(401).json({ error: 'Authentication required' })
    return null
  }

  return session
}

teacherRouter.get('/students', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return

  if (
    (session.user as any)?.userType &&
    (session.user as any).userType !== 'teacher'
  ) {
    return response.status(403).json({ error: 'Teacher role required' })
  }

  const teacher = await Teacher.findOne({ userId: session.user.id })
    .populate('students', 'name')
    .exec()

  if (!teacher) {
    return response.status(404).json({ error: 'Teacher profile not found' })
  }

  const students = (teacher.students as any[]).map(s => ({
    id: s.id,
    name: s.name
  }))

  response.json({ students })
})

export default teacherRouter
