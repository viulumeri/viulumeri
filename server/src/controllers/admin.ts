import { Router, json, type NextFunction, type Request, type Response } from 'express'
import multer from 'multer'
import { fromNodeHeaders } from 'better-auth/node'
import { requireAdmin } from '../utils/auth-middleware'
import { auth } from '../utils/auth'
import { client } from '../db'
import Teacher from '../models/teacher'
import Student from '../models/student'
import Homework from '../models/homework'
import PopupMessage from '../models/popupMessage'
import Feedback from '../models/feedback'
import { getAdminFeedbacks } from '../services/admin'
import { adminSongsService, AdminSongError } from '../services/adminSongs'

type BetterAuthAdminApi = {
  removeUser: (args: {
    body: { userId: string }
    headers: ReturnType<typeof fromNodeHeaders>
  }) => Promise<unknown>
}

type PopulatedStudent = { id: string; name: string; email: string }
type PopulatedTeacher = { id: string; name: string; email: string }
type PopupMessageLean = {
  _id: { toString(): string }
  title: string
  content: string
  images?: PopupMessageImage[]
  postedAt: Date
  isDraft?: boolean
  visibleToTeachers?: boolean
  visibleToStudents?: boolean
  visibleFrom?: string
  visibleUntil?: string
}

type PopupMessageRequestBody = Record<string, unknown>
type PopupMessageImage = {
  data: string
  name: string
  type: string
}

const adminRouter = Router()
adminRouter.use(requireAdmin)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_POPUP_IMAGES = 6
const MAX_POPUP_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_POPUP_IMAGES_TOTAL_BYTES = 10 * 1024 * 1024
const IMAGE_EXTENSION_PATTERN = /\.(avif|gif|heic|heif|jpe?g|png|webp|svg)$/i
const popupImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_POPUP_IMAGES,
    fileSize: MAX_POPUP_IMAGE_BYTES,
    fieldSize: MAX_POPUP_IMAGES_TOTAL_BYTES * 2
  }
})
const parsePopupImageUpload = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  popupImageUpload.array('images')(request, response, error => {
    if (!error) {
      next()
      return
    }

    if (error instanceof multer.MulterError) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'YksittÃ¤inen kuva saa olla enintÃ¤Ã¤n 5 Mt'
          : error.code === 'LIMIT_FILE_COUNT'
            ? `Voit lisÃ¤tÃ¤ enintÃ¤Ã¤n ${MAX_POPUP_IMAGES} kuvaa`
            : 'Kuvien lÃ¤hetys epÃ¤onnistui'
      response.status(400).json({ error: message })
      return
    }

    next(error)
  })
}

const getAdminEmailSet = async (emails: string[]) => {
  const adminUsers = await client
    .db()
    .collection<{ email: string; role?: string }>('user')
    .find({ email: { $in: emails }, role: 'admin' })
    .project<{ email: string }>({ email: 1 })
    .toArray()

  return new Set(adminUsers.map(user => user.email.toLowerCase()))
}

const isAdminEmail = async (email: string) => {
  const adminEmails = await getAdminEmailSet([email])
  return adminEmails.has(email.toLowerCase())
}

const readUserUpdate = (body: Record<string, unknown> | null | undefined) => {
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!name) return { error: 'Name is required' } as const
  if (!EMAIL_PATTERN.test(email)) return { error: 'Invalid email' } as const

  return { name, email }
}

const getBase64PayloadByteLength = (value: string): number => {
  const commaIndex = value.indexOf(',')
  const base64 = (commaIndex >= 0 ? value.slice(commaIndex + 1) : value).trim()
  if (!base64) return 0

  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding)
}

const getImageMimeTypeFromName = (name: string): string => {
  const extension = name.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'avif':
      return 'image/avif'
    case 'gif':
      return 'image/gif'
    case 'heic':
      return 'image/heic'
    case 'heif':
      return 'image/heif'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'svg':
      return 'image/svg+xml'
    case 'webp':
      return 'image/webp'
    default:
      return ''
  }
}

const normalizePopupImages = (value: unknown) => {
  if (value === undefined) return { images: undefined } as const
  if (value === null) return { images: [] } as const
  if (!Array.isArray(value)) return { error: 'Images must be an array' } as const
  if (value.length > MAX_POPUP_IMAGES) {
    return { error: `Voit lisÃ¤tÃ¤ enintÃ¤Ã¤n ${MAX_POPUP_IMAGES} kuvaa` } as const
  }

  let totalBytes = 0
  const images: PopupMessageImage[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      return { error: 'Image payload is invalid' } as const
    }
    const record = item as Record<string, unknown>
    const data = typeof record.data === 'string' ? record.data.trim() : ''
    const name = typeof record.name === 'string' ? record.name.trim() : ''
    const rawType = typeof record.type === 'string' ? record.type.trim() : ''
    const type = rawType || getImageMimeTypeFromName(name)

    if (!data || !name) {
      return { error: 'Image payload is invalid' } as const
    }
    if (!type.startsWith('image/') || (!rawType && !IMAGE_EXTENSION_PATTERN.test(name))) {
      return { error: 'Vain kuvatiedostot ovat sallittuja' } as const
    }

    const byteLength = getBase64PayloadByteLength(data)
    if (byteLength > MAX_POPUP_IMAGE_BYTES) {
      return { error: 'YksittÃ¤inen kuva saa olla enintÃ¤Ã¤n 5 Mt' } as const
    }
    totalBytes += byteLength
    if (totalBytes > MAX_POPUP_IMAGES_TOTAL_BYTES) {
      return { error: 'Kuvien yhteiskoko saa olla enintÃ¤Ã¤n 10 Mt' } as const
    }

    images.push({
      data,
      name: name.slice(0, 200),
      type: type.slice(0, 100)
    })
  }

  return { images } as const
}

const normalizePopupImageFiles = (files: Express.Multer.File[] | undefined) => {
  const uploadedFiles = files ?? []
  if (uploadedFiles.length > MAX_POPUP_IMAGES) {
    return { error: `Voit lisÃ¤tÃ¤ enintÃ¤Ã¤n ${MAX_POPUP_IMAGES} kuvaa` } as const
  }

  let totalBytes = 0
  const images: PopupMessageImage[] = []
  for (const file of uploadedFiles) {
    const type = file.mimetype || getImageMimeTypeFromName(file.originalname)
    if (!type.startsWith('image/')) {
      return { error: 'Vain kuvatiedostot ovat sallittuja' } as const
    }
    if (file.size > MAX_POPUP_IMAGE_BYTES) {
      return { error: 'YksittÃ¤inen kuva saa olla enintÃ¤Ã¤n 5 Mt' } as const
    }
    totalBytes += file.size
    if (totalBytes > MAX_POPUP_IMAGES_TOTAL_BYTES) {
      return { error: 'Kuvien yhteiskoko saa olla enintÃ¤Ã¤n 10 Mt' } as const
    }

    images.push({
      data: `data:${type};base64,${file.buffer.toString('base64')}`,
      name: file.originalname.slice(0, 200),
      type: type.slice(0, 100)
    })
  }

  return { images } as const
}

const serializePopupImages = (images: unknown): PopupMessageImage[] => {
  if (!Array.isArray(images)) return []

  return images
    .filter((image): image is PopupMessageImage => {
      if (!image || typeof image !== 'object') return false
      const record = image as Record<string, unknown>
      return (
        typeof record.data === 'string' &&
        typeof record.name === 'string' &&
        typeof record.type === 'string' &&
        record.type.startsWith('image/')
      )
    })
    .map(image => ({
      data: image.data,
      name: image.name,
      type: image.type
    }))
}

const updateProfile = async (
  request: Request,
  response: Response,
  profileType: 'teacher' | 'student'
) => {
  const update = readUserUpdate(request.body)
  if ('error' in update) {
    return response.status(400).json({ error: update.error })
  }

  const profileId =
    profileType === 'teacher'
      ? request.params.teacherId
      : request.params.studentId
  const profile =
    profileType === 'teacher'
      ? await Teacher.findById(profileId)
      : await Student.findById(profileId)

  if (!profile) {
    return response.status(404).json({
      error: profileType === 'teacher' ? 'Teacher not found' : 'Student not found'
    })
  }

  const duplicateProfile = await Promise.all([
    Teacher.findOne({ email: update.email, userId: { $ne: profile.userId } }),
    Student.findOne({ email: update.email, userId: { $ne: profile.userId } }),
    client
      .db()
      .collection('user')
      .findOne({ email: update.email, id: { $ne: profile.userId } })
  ])
  if (duplicateProfile.some(Boolean)) {
    return response.status(409).json({ error: 'Email is already in use' })
  }

  const authUserUpdate = await client
    .db()
    .collection('user')
    .updateOne(
      { email: profile.email },
      {
        $set: {
          name: update.name,
          email: update.email,
          updatedAt: new Date()
        }
      }
    )
  if (authUserUpdate.matchedCount === 0) {
    return response.status(404).json({ error: 'Auth user not found' })
  }

  profile.name = update.name
  profile.email = update.email
  await profile.save()

  response.json({
    user: {
      id: profile.id,
      userId: profile.userId,
      name: profile.name,
      email: profile.email
    }
  })
}

adminRouter.get('/summary', async (_request, response) => {
  const teacherCount = await Teacher.countDocuments()
  const studentCount = await Student.countDocuments()
  const homeworkCount = await Homework.countDocuments()

  response.json({ teacherCount, studentCount, homeworkCount })
})

adminRouter.get('/teachers', async (request, response) => {
  const teachers = await Teacher.find().populate('students', 'name email')
  const adminEmails = await getAdminEmailSet(
    teachers.map(teacher => teacher.email)
  )

  const result = teachers.map(teacher => ({
    id: teacher.id,
    userId: teacher.userId,
    name: teacher.name,
    email: teacher.email,
    isAdmin: adminEmails.has(teacher.email.toLowerCase()),
    isCurrentUser: teacher.userId === request.session!.user.id,
    studentCount: (teacher.students as unknown as PopulatedStudent[]).length,
    students: (teacher.students as unknown as PopulatedStudent[]).map(student => ({
      id: student.id,
      name: student.name,
      email: student.email
    }))
  }))

  response.json({ teachers: result })
})

adminRouter.get('/students', async (request, response) => {
  const students = await Student.find().populate('teacher', 'name email')
  const adminEmails = await getAdminEmailSet(
    students.map(student => student.email)
  )

  const result = students.map(student => ({
    id: student.id,
    userId: student.userId,
    name: student.name,
    email: student.email,
    isAdmin: adminEmails.has(student.email.toLowerCase()),
    isCurrentUser: student.userId === request.session!.user.id,
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

adminRouter.patch('/teachers/:teacherId', async (request, response) => {
  await updateProfile(request, response, 'teacher')
})

adminRouter.patch('/students/:studentId', async (request, response) => {
  await updateProfile(request, response, 'student')
})

adminRouter.delete('/teachers/:teacherId', async (request, response) => {
  const teacher = await Teacher.findById(request.params.teacherId)
  if (!teacher) {
    return response.status(404).json({ error: 'Teacher not found' })
  }

  if (teacher.userId === request.session!.user.id) {
    return response.status(403).json({ error: 'You cannot delete your own account' })
  }

  if (await isAdminEmail(teacher.email)) {
    return response.status(403).json({ error: 'Admin users cannot be deleted' })
  }

  const authApi = auth.api as unknown as BetterAuthAdminApi
  await authApi.removeUser({
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

  if (student.userId === request.session!.user.id) {
    return response.status(403).json({ error: 'You cannot delete your own account' })
  }

  if (await isAdminEmail(student.email)) {
    return response.status(403).json({ error: 'Admin users cannot be deleted' })
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

  const authApi = auth.api as unknown as BetterAuthAdminApi
  await authApi.removeUser({
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

adminRouter.post('/songs', json({ limit: '100mb' }), async (request, response) => {
  try {
    const song = await adminSongsService.createSong(request.body)
    response.status(201).json({ song })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create song'
    response.status(400).json({ error: message })
  }
})

adminRouter.patch('/songs/:songId', json({ limit: '100mb' }), async (request, response) => {
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
      images: serializePopupImages(message.images),
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
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
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

  if (
    hasVisibleToTeachers &&
    typeof body['visibleToTeachers'] !== 'boolean' &&
    body['visibleToTeachers'] !== 'true' &&
    body['visibleToTeachers'] !== 'false'
  ) {
    return null
  }
  if (
    hasVisibleToStudents &&
    typeof body['visibleToStudents'] !== 'boolean' &&
    body['visibleToStudents'] !== 'true' &&
    body['visibleToStudents'] !== 'false'
  ) {
    return null
  }

  const visibleToTeachers = hasVisibleToTeachers
    ? readBooleanField(body['visibleToTeachers'], true)
    : undefined
  const visibleToStudents = hasVisibleToStudents
    ? readBooleanField(body['visibleToStudents'], true)
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

const readExistingPopupImages = (value: unknown) => {
  if (value === undefined) return { images: [] } as const
  if (typeof value !== 'string') return { error: 'Existing images are invalid' } as const
  if (!value.trim()) return { images: [] } as const

  try {
    return normalizePopupImages(JSON.parse(value))
  } catch {
    return { error: 'Existing images are invalid' } as const
  }
}

adminRouter.post('/popup-messages', parsePopupImageUpload, async (request, response) => {
  const title =
    typeof request.body?.title === 'string' ? request.body.title.trim() : ''
  const content =
    typeof request.body?.content === 'string' ? request.body.content.trim() : ''
  const isDraft = request.body?.isDraft === true || request.body?.isDraft === 'true'
  const visibility = normalizeVisibility(request.body as PopupMessageRequestBody)
  const visibilityWindow = normalizeVisibilityWindow(request.body as PopupMessageRequestBody)
  const fileImageResult = normalizePopupImageFiles(request.files as Express.Multer.File[] | undefined)

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
  if ('error' in fileImageResult) {
    return response.status(400).json({ error: fileImageResult.error })
  }
  const bodyImageResult =
    fileImageResult.images.length === 0
      ? normalizePopupImages(request.body?.images)
      : { images: undefined } as const
  if ('error' in bodyImageResult) {
    return response.status(400).json({ error: bodyImageResult.error })
  }
  const fileImages = fileImageResult.images ?? []
  const popupImages =
    fileImages.length > 0
      ? fileImages
      : bodyImageResult.images ?? []

  const doc = await PopupMessage.create({
    title,
    content,
    images: popupImages,
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
      images: serializePopupImages(doc.images),
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

adminRouter.patch('/popup-messages/:messageId', parsePopupImageUpload, async (request, response) => {
  const doc = await PopupMessage.findById(request.params.messageId)

  if (!doc) {
    return response.status(404).json({ error: 'Popup message not found' })
  }

  const hasTitle = typeof request.body?.title === 'string'
  const hasContent = typeof request.body?.content === 'string'
  const hasIsDraft =
    typeof request.body?.isDraft === 'boolean' ||
    request.body?.isDraft === 'true' ||
    request.body?.isDraft === 'false'
  const existingImageResult = Object.prototype.hasOwnProperty.call(
    request.body ?? {},
    'existingImages'
  )
    ? readExistingPopupImages(request.body?.existingImages)
    : Object.prototype.hasOwnProperty.call(request.body ?? {}, 'images')
      ? normalizePopupImages(request.body?.images)
    : undefined
  const fileImageResult = normalizePopupImageFiles(request.files as Express.Multer.File[] | undefined)

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
  if (existingImageResult && 'error' in existingImageResult) {
    return response.status(400).json({ error: existingImageResult.error })
  }
  if ('error' in fileImageResult) {
    return response.status(400).json({ error: fileImageResult.error })
  }
  const existingImages: PopupMessageImage[] =
    existingImageResult && 'images' in existingImageResult
      ? [...(existingImageResult.images ?? [])]
      : []
  if (existingImages.length + fileImageResult.images.length > MAX_POPUP_IMAGES) {
    return response.status(400).json({ error: `Voit lisÃ¤tÃ¤ enintÃ¤Ã¤n ${MAX_POPUP_IMAGES} kuvaa` })
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
    doc.isDraft = readBooleanField(request.body.isDraft, doc.isDraft)
    if (wasDraft && !doc.isDraft) {
      doc.postedAt = new Date()
    }
  }

  if (existingImageResult) {
    doc.set('images', [...existingImages, ...fileImageResult.images])
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
      images: serializePopupImages(doc.images),
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

adminRouter.delete('/feedbacks/:feedbackId', async (request, response) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(request.params.feedbackId)

    if (!feedback) {
      return response.status(404).json({ error: 'Feedback not found' })
    }

    return response.status(204).send()
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'CastError') {
      return response.status(400).json({ error: 'Invalid feedback id' })
    }
    throw error
  }
})

export default adminRouter
