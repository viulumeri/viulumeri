import { Router, Request, Response } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../utils/auth'
import Teacher from '../models/teacher'
import { generateInviteToken } from '../utils/inviteToken'

const inviteRouter = Router()

async function getSession(req: Request, res: Response) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers)
  })
  if (!session) {
    res.status(401).json({ error: 'Authentication required' })
    return null
  }
  return session
}

inviteRouter.post('/', async (req, res) => {
  const session = await getSession(req, res)
  if (!session) return

  if (session.user.userType !== 'teacher') {
    return res.status(403).json({ error: 'Teacher role required' })
  }

  const teacher = await Teacher.findOne({ userId: session.user.id })
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher profile not found' })
  }

  const token = generateInviteToken(teacher._id.toString())

  const base = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`
  const inviteUrl = `${base.replace(/\/$/, '')}/invite/${encodeURIComponent(token)}`

  res.json({ inviteUrl, expiresIn: '7 days' })
})

export default inviteRouter
