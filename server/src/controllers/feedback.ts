import express from 'express'
import Feedback from '../models/feedback'
import type { SubmitFeedbackBody, FeedbackCategory, SubmitFeedbackResponse } from '../../../shared/types'

const router = express.Router()

type RateKey = string
type RateEntry = { count: number; resetAt: number }

// Simple in-memory rate limit to reduce spam:
// 5 submissions / 10 minutes per user+ip.
const rateWindowMs = 10 * 60 * 1000
const rateMax = 5
const rateMap = new Map<RateKey, RateEntry>()

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
  const key: RateKey = `${userId}:${ip}`
  const now = Date.now()
  const entry = rateMap.get(key)
  if (!entry || entry.resetAt <= now) {
    rateMap.set(key, { count: 1, resetAt: now + rateWindowMs })
  } else if (entry.count >= rateMax) {
    res.status(429).json({ error: 'Too many requests' })
    return
  } else {
    entry.count += 1
    rateMap.set(key, entry)
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
