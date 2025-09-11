import { Router } from 'express'
import { 
  authenticateSession, 
  requireStudent,
  validateStudentProfile 
} from '../utils/session-helpers'

const playedSongsRouter = Router()

playedSongsRouter.get('/', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireStudent(session, response)) return

  const student = await validateStudentProfile(session, response)
  if (!student) return

  response.json({
    playedSongs: student.playedSongs
  })
})

export default playedSongsRouter

