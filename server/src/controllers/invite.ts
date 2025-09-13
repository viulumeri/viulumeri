import { Router } from 'express'
import {
  authenticateSession,
  requireTeacher,
  validateTeacherProfile,
  validateStudentProfile
} from '../utils/session-helpers'
import Teacher from '../models/teacher'
import Student from '../models/student'
import { generateInviteToken, verifyInviteToken } from '../utils/inviteToken'

const inviteRouter = Router()

inviteRouter.post('/', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireTeacher(session, response)) return

  const teacher = await validateTeacherProfile(session, response)
  if (!teacher) return

  const token = generateInviteToken(teacher._id.toString())

  const base =
    process.env.CLIENT_URL || `${request.protocol}://${request.get('host')}`
  const inviteUrl = `${base.replace(/\/$/, '')}/invite/${encodeURIComponent(token)}`

  response.json({ inviteUrl, expiresIn: '7 days' }) // Tarviikohan tätä expiresIn ?
})

inviteRouter.get('/:token', async (request, response) => {
  const session = await authenticateSession(request, response)
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
  const session = await authenticateSession(request, response)
  if (!session) return

  const payload = verifyInviteToken(request.params.token)
  if (!payload) {
    return response.status(400).json({ error: 'Invalid or expired invitation' })
  }

  const teacher = await Teacher.findById(payload.teacherId)
  if (!teacher) return response.status(404).json({ error: 'Teacher not found' })

  const student = await validateStudentProfile(session, response)
  if (!student) return

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
