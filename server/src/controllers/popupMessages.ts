import { Router } from 'express'
import PopupMessage from '../models/popupMessage'

type PopupMessageDTO = {
  id: string
  title: string
  content: string
  postedAt: string
  visibleToTeachers: boolean
  visibleToStudents: boolean
  visibleFrom?: string
  visibleUntil?: string
}

type PopupMessageLean = {
  _id: { toString(): string }
  title: string
  content: string
  postedAt: Date
  visibleToTeachers?: boolean
  visibleToStudents?: boolean
  visibleFrom?: string
  visibleUntil?: string
}

const POPUP_MESSAGES_ENV = 'POPUP_MESSAGES_JSON'

const parseEnvMessages = (): Omit<PopupMessageDTO, 'id'>[] => {
  const raw = process.env[POPUP_MESSAGES_ENV]
  if (!raw || !raw.trim()) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
      .map(m => ({
        title: typeof m.title === 'string' ? m.title : '',
        content: typeof m.content === 'string' ? m.content : '',
        postedAt: typeof m.postedAt === 'string' ? m.postedAt : new Date().toISOString(),
        visibleToTeachers: true,
        visibleToStudents: true
      }))
      .filter(m => m.title.trim().length > 0 && m.content.trim().length > 0)
  } catch {
    return []
  }
}

const popupMessagesRouter = Router()

const getLocalDateKey = (date = new Date()): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const isMessageVisibleNow = (
  message: { visibleFrom?: unknown; visibleUntil?: unknown },
  todayKey = getLocalDateKey()
): boolean => {
  const visibleFrom = typeof message.visibleFrom === 'string' ? message.visibleFrom : undefined
  const visibleUntil = typeof message.visibleUntil === 'string' ? message.visibleUntil : undefined

  if (visibleFrom && todayKey < visibleFrom) return false
  if (visibleUntil && todayKey > visibleUntil) return false
  return true
}

popupMessagesRouter.get('/', async (_request, response) => {
  const userType = _request.session?.user?.userType
  if (userType !== 'teacher' && userType !== 'student') {
    response.json({ messages: [] })
    return
  }

  const visibilityField =
    userType === 'teacher' ? 'visibleToTeachers' : 'visibleToStudents'

  const todayKey = getLocalDateKey()
  const dbMessages = await PopupMessage.find({
    isDraft: { $ne: true },
    [visibilityField]: { $ne: false }
  })
    .sort({ postedAt: -1 })
    .lean()

  const envMessages = parseEnvMessages()

  const result: PopupMessageDTO[] = [
    ...envMessages.map(m => ({
      id: `env:${m.postedAt}:${m.title}`,
      title: m.title,
      content: m.content,
      postedAt: m.postedAt,
      visibleToTeachers: true,
      visibleToStudents: true
    })),
    ...(dbMessages as unknown as PopupMessageLean[])
      .filter(m => isMessageVisibleNow(m, todayKey))
      .map(m => ({
        id: m._id.toString(),
        title: m.title,
        content: m.content,
        postedAt: new Date(m.postedAt).toISOString(),
        visibleToTeachers: m.visibleToTeachers !== false,
        visibleToStudents: m.visibleToStudents !== false,
        visibleFrom: m.visibleFrom,
        visibleUntil: m.visibleUntil
      }))
  ]

  result.sort((a, b) => {
    const aTime = Date.parse(a.postedAt) || 0
    const bTime = Date.parse(b.postedAt) || 0
    return bTime - aTime
  })

  response.json({ messages: result })
})

export default popupMessagesRouter
