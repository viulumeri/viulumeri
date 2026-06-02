import { Router } from 'express'
import PopupMessage from '../models/popupMessage'

type PopupMessageDTO = {
  id: string
  title: string
  content: string
  postedAt: string
}

type PopupMessageLean = {
  _id: { toString(): string }
  title: string
  content: string
  postedAt: Date
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
        postedAt: typeof m.postedAt === 'string' ? m.postedAt : new Date().toISOString()
      }))
      .filter(m => m.title.trim().length > 0 && m.content.trim().length > 0)
  } catch {
    return []
  }
}

const popupMessagesRouter = Router()

popupMessagesRouter.get('/', async (_request, response) => {
  const dbMessages = await PopupMessage.find({ isDraft: { $ne: true } })
    .sort({ postedAt: -1 })
    .lean()

  const envMessages = parseEnvMessages()

  const result: PopupMessageDTO[] = [
    ...envMessages.map(m => ({
      id: `env:${m.postedAt}:${m.title}`,
      title: m.title,
      content: m.content,
      postedAt: m.postedAt
    })),
    ...(dbMessages as unknown as PopupMessageLean[]).map(m => ({
      id: m._id.toString(),
      title: m.title,
      content: m.content,
      postedAt: new Date(m.postedAt).toISOString()
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
