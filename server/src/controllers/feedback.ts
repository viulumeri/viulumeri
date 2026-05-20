import express from 'express'
import Feedback from '../models/feedback'
import RateLimit from '../models/rateLimit'
import type { SubmitFeedbackBody, FeedbackCategory, SubmitFeedbackResponse } from '../../../shared/types'

const router = express.Router()

// MongoDB-backed rate limit: 5 submissions / 10 minutes per user+ip.
// Persisted in the database so limits are shared across all server instances.
const rateWindowMs = 10 * 60 * 1000
const rateMax = 5

const isValidCategory = (value: unknown): value is FeedbackCategory =>
  value === 'bug' || value === 'feature' || value === 'other'

router.post('/', async (req, res) => {
  const body = req.body as Partial<SubmitFeedbackBody>

  // Honeypot spam trap.
  if (typeof body.website === 'string' && body.website.trim().length > 0) {
    res.status(400).json({ error: 'Invalid submission' })
    return
  }

  if (!isValidCategory(body.category)) {
    res.status(400).json({ error: 'Invalid category' })
    return
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title || title.length > 200) {
    res.status(400).json({ error: 'Invalid title' })
    return
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message || message.length < 5 || message.length > 4000) {
    res.status(400).json({ error: 'Invalid message' })
    return
  }

  const userId = req.session?.user?.id
  const userType = req.session?.user?.userType
  if (!userId || !userType) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const ip = req.ip
  const key = `${userId}:${ip}`
  const now = new Date()
  const resetAt = new Date(now.getTime() + rateWindowMs)

  const rateEntry = await RateLimit.findOneAndUpdate(
    { key, resetAt: { $gt: now } },
    { $inc: { count: 1 }, $setOnInsert: { resetAt } },
    { upsert: true, new: true }
  )

  if (rateEntry.count > rateMax) {
    res.status(429).json({ error: 'Too many requests' })
    return
  }

  await Feedback.create({
    userId,
    userType,
    title,
    category: body.category,
    message,
    ip,
    userAgent: req.get('user-agent')
  })

  const response: SubmitFeedbackResponse = { ok: true }
  res.status(201).json(response)
})

export default router
