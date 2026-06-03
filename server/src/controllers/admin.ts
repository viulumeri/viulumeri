import { Router } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import { requireAdmin } from '../utils/auth-middleware'
import { auth } from '../utils/auth'
import Teacher from '../models/teacher'
import Student from '../models/student'
import Homework from '../models/homework'
import PopupMessage from '../models/popupMessage'
import { getAdminFeedbacks } from '../services/admin'

type PopulatedStudent = { id: string; name: string; email: string }
type PopulatedTeacher = { id: string; name: string; email: string }
type PopupMessageLean = {
  _id: { toString(): string }
  title: string
  content: string
  postedAt: Date
  isDraft: boolean
}

const adminRouter = Router()
adminRouter.use(requireAdmin)

adminRouter.get('/summary', async (_request, response) => {
  const teacherCount = await Teacher.countDocuments()
  const studentCount = await Student.countDocuments()
  const homeworkCount = await Homework.countDocuments()

  response.json({ teacherCount, studentCount, homeworkCount })
})

adminRouter.get('/teachers', async (_request, response) => {
  const teachers = await Teacher.find().populate('students', 'name email')

  const result = teachers.map(teacher => ({
    id: teacher.id,
    userId: teacher.userId,
    name: teacher.name,
    email: teacher.email,
    studentCount: (teacher.students as unknown as PopulatedStudent[]).length,
    students: (teacher.students as unknown as PopulatedStudent[]).map(student => ({
      id: student.id,
      name: student.name,
      email: student.email
    }))
  }))

  response.json({ teachers: result })
})

adminRouter.get('/students', async (_request, response) => {
  const students = await Student.find().populate('teacher', 'name email')

  const result = students.map(student => ({
    id: student.id,
    userId: student.userId,
    name: student.name,
    email: student.email,
    playedSongs: student.playedSongs,
    teacher: student.teacher
      ? {
          id: (student.teacher as unknown as PopulatedTeacher).id,
          name: (student.teacher as unknown as PopulatedTeacher).name,
          email: (student.teacher as unknown as PopulatedTeacher).email
        }
      : null
  }))

  response.json({ students: result })
})

adminRouter.post('/impersonate', async (request, response) => {
  const { profileId, profileType } = request.body ?? {}

  if (typeof profileId !== 'string' || !profileId.trim()) {
    return response.status(400).json({ error: 'Invalid profile id' })
  }

  if (profileType !== 'teacher' && profileType !== 'student') {
    return response.status(400).json({ error: 'Invalid profile type' })
  }

  let profile
  try {
    profile = profileType === 'teacher'
      ? await Teacher.findById(profileId)
      : await Student.findById(profileId)
  } catch {
    return response.status(400).json({ error: 'Invalid profile id' })
  }

  if (!profile) {
    return response.status(404).json({ error: 'Profile not found' })
  }

  const impersonationResult = await (auth.api as any).impersonateUser({
    body: { userId: profile.userId },
    headers: fromNodeHeaders(request.headers)
  })

  if (!impersonationResult?.session?.token) {
    return response.status(500).json({ error: 'Failed to create impersonation session' })
  }

  const expiresAt = new Date(impersonationResult.session.expiresAt)

  response.cookie('better-auth.session_token', impersonationResult.session.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV !== 'test',
    path: '/',
    expires: expiresAt
  })

  response.json({
    session: impersonationResult.session,
    user: impersonationResult.user
  })
})

adminRouter.delete('/teachers/:teacherId', async (request, response) => {
  const teacher = await Teacher.findById(request.params.teacherId)
  if (!teacher) {
    return response.status(404).json({ error: 'Teacher not found' })
  }

  await auth.api.removeUser({
    body: { userId: teacher.userId },
    headers: fromNodeHeaders(request.headers)
  })
  await Student.updateMany(
    { teacher: teacher.id },
    { $unset: { teacher: 1 } }
  )
  await teacher.deleteOne()

  response.status(204).send()
})

adminRouter.delete('/students/:studentId', async (request, response) => {
  const student = await Student.findById(request.params.studentId)
  if (!student) {
    return response.status(404).json({ error: 'Student not found' })
  }

  if (student.teacher) {
    const teacher = await Teacher.findById(student.teacher)
    if (teacher) {
      teacher.students = teacher.students.filter(
        studentId => studentId.toString() !== student.id
      )
      await teacher.save()
    }
  }

  await auth.api.removeUser({
    body: { userId: student.userId },
    headers: fromNodeHeaders(request.headers)
  })
  await Homework.deleteMany({ student: student.id })
  await student.deleteOne()

  response.status(204).send()
})

adminRouter.get('/popup-messages', async (_request, response) => {
  const messages = await PopupMessage.find().sort({ postedAt: -1 }).lean()

  response.json({
    messages: (messages as unknown as PopupMessageLean[]).map(message => ({
      id: message._id.toString(),
      title: message.title,
      content: message.content,
      postedAt: new Date(message.postedAt).toISOString(),
      isDraft: Boolean(message.isDraft)
    }))
  })
})

adminRouter.post('/popup-messages', async (request, response) => {
  const title =
    typeof request.body?.title === 'string' ? request.body.title.trim() : ''
  const content =
    typeof request.body?.content === 'string' ? request.body.content.trim() : ''
  const isDraft = request.body?.isDraft === true

  if (!title) {
    return response.status(400).json({ error: 'Title is required' })
  }
  if (!content) {
    return response.status(400).json({ error: 'Content is required' })
  }

  const doc = await PopupMessage.create({
    title,
    content,
    postedAt: new Date(),
    isDraft
  })

  response.status(201).json({
    message: {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      postedAt: doc.postedAt.toISOString(),
      isDraft: doc.isDraft
    }
  })
})

adminRouter.patch('/popup-messages/:messageId', async (request, response) => {
  const isDraft = request.body?.isDraft



  if (typeof isDraft !== 'boolean') {

    return response.status(400).json({ error: 'isDraft boolean is required' })
  }

  const doc = await PopupMessage.findById(request.params.messageId)

  if (!doc) {
    return response.status(404).json({ error: 'Popup message not found' })
  }

  const wasDraft = doc.isDraft

  doc.isDraft = isDraft

  if (wasDraft && !isDraft) {

    doc.postedAt = new Date()

  }

  await doc.save()



  response.json({
    message: {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      postedAt: doc.postedAt.toISOString(),
      isDraft: doc.isDraft
    }
  })
})

adminRouter.delete('/popup-messages/:messageId', async (request, response) => {
  const doc = await PopupMessage.findByIdAndDelete(request.params.messageId)

  if (!doc) {
    return response.status(404).json({ error: 'Popup message not found' })
  }

  response.status(204).send()
})

adminRouter.delete('/popup-messages', async (_request, response) => {
  await PopupMessage.deleteMany({})
  response.status(204).send()
})

adminRouter.get('/feedbacks', async (_request, response) => {
  const feedbacks = await getAdminFeedbacks()
  response.json({ feedbacks })
})

export default adminRouter
