import { Router, Request, Response } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../utils/auth'
import Teacher from '../models/teacher'
import { generateInviteToken } from '../utils/inviteToken'
import Student from '../models/student'
import { verifyInviteToken } from '../utils/inviteToken'

const inviteRouter = Router()

const getSession = async (request: Request, response: Response) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers)
  })
  if (!session) {
    response.status(401).json({ error: 'Authentication required' })
    return null
  }
  return session
}

inviteRouter.post('/', async (request, response) => {
  const session = await getSession(request, response)
  if (!session) return

  if (session.user.userType !== 'teacher') {
    return response.status(403).json({ error: 'Teacher role required' })
  }

  const teacher = await Teacher.findOne({ userId: session.user.id })
  if (!teacher) {
    return response.status(404).json({ error: 'Teacher profile not found' })
  }

  const token = generateInviteToken(teacher._id.toString())

  const base =
    process.env.CLIENT_URL || `${request.protocol}://${request.get('host')}`
  const inviteUrl = `${base.replace(/\/$/, '')}/invite/${encodeURIComponent(token)}`

  response.json({ inviteUrl, expiresIn: '7 days' })
})

inviteRouter.get('/:token', async (request, response) => {
  const session = await getSession(request, response)
  if (!session) return

  const payload = verifyInviteToken(request.params.token)
  if (!payload)
    return response.status(400).json({ error: 'Invalid or expired invitation' })

  const teacher = await Teacher.findById(payload.teacherId).select('name')
  if (!teacher) {
    return response.status(404).json({ error: 'Teacher not found' })
  }

  const student = await Student.findOne({ userId: session.user.id }).populate(
    'teacher',
    'name'
  )
  const currentTeacher = student?.teacher as any | null

  return response.json({
    teacher: { id: teacher.id, name: teacher.name },
    currentTeacher: currentTeacher
      ? { id: currentTeacher.id, name: currentTeacher.name }
      : null
  })
})

inviteRouter.post('/:token/accept', async (request, response) => {
  const session = await getSession(request, response)
  if (!session) return

  const payload = verifyInviteToken(request.params.token)
  if (!payload) {
    return response.status(400).json({ error: 'Invalid or expired invitation' })
  }

  const [teacher, student] = await Promise.all([
    Teacher.findById(payload.teacherId),
    Student.findOne({ userId: session.user.id })
  ])

  if (!teacher) return response.status(404).json({ error: 'Teacher not found' })
  if (!student)
    return response.status(404).json({ error: 'Student profile not found' })

  //
  if (student.teacher && teacher._id.equals(student.teacher))
    return response.json({
      teacher: { id: teacher.id, name: teacher.name },
      changed: false
    })

  const ops: Promise<any>[] = [
    Student.updateOne({ _id: student._id }, { $set: { teacher: teacher._id } }),
    Teacher.updateOne(
      { _id: teacher._id },
      { $addToSet: { students: student._id } }
    )
  ]

  if (student.teacher) {
    ops.push(
      Teacher.updateOne(
        { _id: student.teacher },
        { $pull: { students: student._id } }
      )
    )
  }

  await Promise.all(ops)

  return response.json({
    teacher: { id: teacher.id, name: teacher.name },
    changed: true
  })
})

export default inviteRouter
