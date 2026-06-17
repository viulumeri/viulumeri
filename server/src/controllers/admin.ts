import { Router } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import { requireAdmin } from '../utils/auth-middleware'
import { auth } from '../utils/auth'
import Teacher from '../models/teacher'
import Student from '../models/student'
import Homework from '../models/homework'
import PopupMessage from '../models/popupMessage'
import Feedback from '../models/feedback'
import { getAdminFeedbacks } from '../services/admin'
import { adminSongsService, AdminSongError } from '../services/adminSongs'

type BetterAuthImpersonationResult = {
  session?: {
    token: string
    expiresAt: string
    [key: string]: unknown
  }
  user?: unknown
}
type BetterAuthApiWithImpersonation = {
  impersonateUser: (args: {
    body: { userId: string }
    headers: ReturnType<typeof fromNodeHeaders>
  }) => Promise<BetterAuthImpersonationResult>
}

type PopulatedStudent = { id: string; name: string; email: string }
type PopulatedTeacher = { id: string; name: string; email: string }
type PopupMessageLean = {
  _id: { toString(): string }
  title: string
  content: string
  postedAt: Date
  isDraft?: boolean
  visibleToTeachers?: boolean
  visibleToStudents?: boolean
  visibleFrom?: string
  visibleUntil?: string
}

type PopupMessageRequestBody = Record<string, unknown>

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

  const authApi = auth.api as unknown as BetterAuthApiWithImpersonation
  const impersonationResult = await authApi.impersonateUser({
    body: { userId: profile.userId },
    headers: fromNodeHeaders(request.headers)
  })

  if (!impersonationResult?.session?.token) {
    return response.status(500).json({ error: 'Failed to create impersonation session' })
  }

  // Cookie is the source of truth; don't expose the session token in JSON.
  const { token: _token, ...safeSession } = impersonationResult.session

  const expiresAt = new Date(impersonationResult.session.expiresAt)

  response.cookie('better-auth.session_token', impersonationResult.session.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging',
    path: '/',
    expires: expiresAt
  })

  response.json({
    session: safeSession,
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

adminRouter.get('/songs', async (_request, response) => {
  const songs = await adminSongsService.listSongs()
  response.json({ songs })
})

adminRouter.post('/songs', async (request, response) => {
  try {
    const song = await adminSongsService.createSong(request.body)
    response.status(201).json({ song })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create song'
    response.status(400).json({ error: message })
  }
})

adminRouter.patch('/songs/:songId', async (request, response) => {
  try {
    const song = await adminSongsService.updateSong(
      request.params.songId,
      request.body
    )
    response.json({ song })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update song'
    response
      .status(error instanceof AdminSongError ? error.statusCode : 400)
      .json({ error: message })
  }
})

adminRouter.delete('/songs/:songId', async (request, response) => {
  try {
    await adminSongsService.deleteSong(request.params.songId)
    response.status(204).send()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete song'
    response
      .status(error instanceof AdminSongError ? error.statusCode : 400)
      .json({ error: message })
  }
})

adminRouter.get('/popup-messages', async (_request, response) => {
  const messages = (await PopupMessage.find()
    .sort({ postedAt: -1 })
    .lean()) as PopupMessageLean[]
  const todayKey = getLocalDateKey()

  response.json({
    messages: messages.map(message => ({
      id: message._id.toString(),
      title: message.title,
      content: message.content,
      postedAt: new Date(message.postedAt).toISOString(),
      isDraft: Boolean(message.isDraft),
      visibleToTeachers: message.visibleToTeachers !== false,
      visibleToStudents: message.visibleToStudents !== false,
      visibleFrom:
        typeof message.visibleFrom === 'string'
          ? message.visibleFrom
          : undefined,
      visibleUntil:
        typeof message.visibleUntil === 'string'
          ? message.visibleUntil
          : undefined,
      visibilityStatus: getVisibilityStatus(message, todayKey)
    }))
  })
})

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const getLocalDateKey = (date = new Date()): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const readDateField = (
  value: unknown
): string | null | undefined | 'invalid' => {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') return 'invalid'

  const trimmed = value.trim()
  if (!trimmed) return null
  return DATE_KEY_PATTERN.test(trimmed) ? trimmed : 'invalid'
}

const getVisibilityStatus = (
  message: { visibleFrom?: unknown; visibleUntil?: unknown },
  todayKey = getLocalDateKey()
): 'always' | 'upcoming' | 'active' | 'expired' => {
  const visibleFrom = typeof message.visibleFrom === 'string' ? message.visibleFrom : undefined
  const visibleUntil = typeof message.visibleUntil === 'string' ? message.visibleUntil : undefined

  if (!visibleFrom && !visibleUntil) return 'always'
  if (visibleFrom && todayKey < visibleFrom) return 'upcoming'
  if (visibleUntil && todayKey > visibleUntil) return 'expired'
  return 'active'
}

const normalizeVisibilityWindow = (requestBody: PopupMessageRequestBody | null | undefined) => {
  const body = requestBody ?? {}
  const hasVisibleFrom = Object.prototype.hasOwnProperty.call(
    body,
    'visibleFrom'
  )
  const hasVisibleUntil = Object.prototype.hasOwnProperty.call(
    body,
    'visibleUntil'
  )

  const visibleFrom = hasVisibleFrom ? readDateField(body['visibleFrom']) : undefined
  const visibleUntil = hasVisibleUntil ? readDateField(body['visibleUntil']) : undefined

  if (visibleFrom === 'invalid' || visibleUntil === 'invalid') {
    return null
  }

  if (visibleFrom === undefined || visibleUntil === undefined) {
    return { visibleFrom, visibleUntil }
  }

  if (visibleFrom !== null && visibleUntil !== null && visibleFrom > visibleUntil) {
    return null
  }

  return { visibleFrom, visibleUntil }
}

const readBooleanField = (
  value: unknown,
  fallback: boolean
): boolean => {
  return typeof value === 'boolean' ? value : fallback
}

const normalizeVisibility = (requestBody: PopupMessageRequestBody | null | undefined) => {
  const body = requestBody ?? {}
  const visibleToTeachers = readBooleanField(body['visibleToTeachers'], true)
  const visibleToStudents = readBooleanField(body['visibleToStudents'], true)

  if (!visibleToTeachers && !visibleToStudents) {
    return null
  }

  return { visibleToTeachers, visibleToStudents }
}

const readVisibilityUpdate = (requestBody: PopupMessageRequestBody | null | undefined) => {
  const body = requestBody ?? {}
  const hasVisibleToTeachers = Object.prototype.hasOwnProperty.call(
    body,
    'visibleToTeachers'
  )
  const hasVisibleToStudents = Object.prototype.hasOwnProperty.call(
    body,
    'visibleToStudents'
  )

  if (!hasVisibleToTeachers && !hasVisibleToStudents) {
    return null
  }

  if (hasVisibleToTeachers && typeof body['visibleToTeachers'] !== 'boolean') {
    return null
  }
  if (hasVisibleToStudents && typeof body['visibleToStudents'] !== 'boolean') {
    return null
  }

  const visibleToTeachers = hasVisibleToTeachers
    ? (body['visibleToTeachers'] as boolean)
    : undefined
  const visibleToStudents = hasVisibleToStudents
    ? (body['visibleToStudents'] as boolean)
    : undefined
  if (visibleToTeachers === undefined && visibleToStudents === undefined) {
    return null
  }

  if (visibleToTeachers === false && visibleToStudents === false) {
    return null
  }

  return {
    visibleToTeachers,
    visibleToStudents
  }
}

adminRouter.post('/popup-messages', async (request, response) => {
  const title =
    typeof request.body?.title === 'string' ? request.body.title.trim() : ''
  const content =
    typeof request.body?.content === 'string' ? request.body.content.trim() : ''
  const isDraft = request.body?.isDraft === true
  const visibility = normalizeVisibility(request.body as PopupMessageRequestBody)
  const visibilityWindow = normalizeVisibilityWindow(request.body as PopupMessageRequestBody)

  if (!title) {
    return response.status(400).json({ error: 'Title is required' })
  }
  if (!content) {
    return response.status(400).json({ error: 'Content is required' })
  }
  if (!visibility) {
    return response.status(400).json({ error: 'At least one audience must be selected' })
  }
  if (!visibilityWindow) {
    return response.status(400).json({ error: 'Visibility period is invalid' })
  }

  const doc = await PopupMessage.create({
    title,
    content,
    postedAt: new Date(),
    isDraft,
    ...visibility,
    ...(visibilityWindow.visibleFrom ? { visibleFrom: visibilityWindow.visibleFrom } : {}),
    ...(visibilityWindow.visibleUntil ? { visibleUntil: visibilityWindow.visibleUntil } : {})
  })

  response.status(201).json({
    message: {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      postedAt: doc.postedAt.toISOString(),
      isDraft: doc.isDraft,
      visibleToTeachers: doc.visibleToTeachers,
      visibleToStudents: doc.visibleToStudents,
      visibleFrom: doc.visibleFrom,
      visibleUntil: doc.visibleUntil,
      visibilityStatus: getVisibilityStatus(doc.toObject())
    }
  })
})

adminRouter.patch('/popup-messages/:messageId', async (request, response) => {
  const doc = await PopupMessage.findById(request.params.messageId)

  if (!doc) {
    return response.status(404).json({ error: 'Popup message not found' })
  }

  const hasTitle = typeof request.body?.title === 'string'
  const hasContent = typeof request.body?.content === 'string'
  const hasIsDraft = typeof request.body?.isDraft === 'boolean'

  const hasVisibleToTeachers = Object.prototype.hasOwnProperty.call(
    request.body ?? {},
    'visibleToTeachers'
  )
  const hasVisibleToStudents = Object.prototype.hasOwnProperty.call(
    request.body ?? {},
    'visibleToStudents'
  )
  const visibility = readVisibilityUpdate(request.body as PopupMessageRequestBody)

  const hasVisibleFrom = Object.prototype.hasOwnProperty.call(
    request.body ?? {},
    'visibleFrom'
  )
  const hasVisibleUntil = Object.prototype.hasOwnProperty.call(
    request.body ?? {},
    'visibleUntil'
  )
  const visibilityWindow =
    hasVisibleFrom || hasVisibleUntil
      ? normalizeVisibilityWindow(request.body as PopupMessageRequestBody)
      : undefined

  if ((hasVisibleToTeachers || hasVisibleToStudents) && !visibility) {
    return response
      .status(400)
      .json({ error: 'At least one audience must be selected' })
  }

  if ((hasVisibleFrom || hasVisibleUntil) && !visibilityWindow) {
    return response.status(400).json({ error: 'Visibility period is invalid' })
  }
  if (hasTitle) {
    const title = request.body.title.trim()
    if (!title) {
      return response.status(400).json({ error: 'Title is required' })
    }
    doc.title = title
  }

  if (hasContent) {
    const content = request.body.content.trim()
    if (!content) {
      return response.status(400).json({ error: 'Content is required' })
    }
    doc.content = content
  }

  if (hasIsDraft) {
    const wasDraft = doc.isDraft
    doc.isDraft = request.body.isDraft
    if (wasDraft && !doc.isDraft) {
      doc.postedAt = new Date()
    }
  }

  if (visibility) {
    if (typeof visibility.visibleToTeachers === 'boolean') {
      doc.visibleToTeachers = visibility.visibleToTeachers
    }
    if (typeof visibility.visibleToStudents === 'boolean') {
      doc.visibleToStudents = visibility.visibleToStudents
    }
  }

  if (visibilityWindow) {
    if (visibilityWindow.visibleFrom !== undefined) {
      doc.visibleFrom = visibilityWindow.visibleFrom ?? undefined
    }
    if (visibilityWindow.visibleUntil !== undefined) {
      doc.visibleUntil = visibilityWindow.visibleUntil ?? undefined
    }
    if (
      doc.visibleFrom &&
      doc.visibleUntil &&
      doc.visibleFrom > doc.visibleUntil
    ) {
      return response.status(400).json({ error: 'Visibility period is invalid' })
    }
  }

  await doc.save()

  response.json({
    message: {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      postedAt: doc.postedAt.toISOString(),
      isDraft: doc.isDraft,
      visibleToTeachers: doc.visibleToTeachers,
      visibleToStudents: doc.visibleToStudents,
      visibleFrom: doc.visibleFrom,
      visibleUntil: doc.visibleUntil,
      visibilityStatus: getVisibilityStatus(doc.toObject())
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

adminRouter.patch('/feedbacks/:feedbackId', async (request, response) => {
  const isRead = request.body?.isRead
  if (typeof isRead !== 'boolean') {
    return response.status(400).json({ error: 'isRead must be boolean' })
  }

  const feedback = await Feedback.findById(request.params.feedbackId)
  if (!feedback) {
    return response.status(404).json({ error: 'Feedback not found' })
  }

  feedback.isRead = isRead
  await feedback.save()

  response.json({
    feedback: {
      id: String(feedback._id),
      isRead: feedback.isRead === true
    }
  })
})

export default adminRouter
