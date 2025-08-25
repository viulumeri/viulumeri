import { Router } from 'express'
import { authenticateSession, requireStudent } from '../utils/session-helpers'
import Student from '../models/student'

const playedSongsRouter = Router()

playedSongsRouter.get('/', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireStudent(session, response)) return

  const student = await Student.findOne({ userId: session.user.id })
  if (!student)
    return response.status(404).json({ error: 'Student profile not found' })

  response.json({
    playedSongs: student.playedSongs
  })
})

export default playedSongsRouter

