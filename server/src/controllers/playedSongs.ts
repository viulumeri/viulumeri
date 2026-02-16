/// <reference path="../types/express.d.ts" />
import { Router } from 'express'
import { requireStudent, loadStudentProfile } from '../utils/auth-middleware'

const playedSongsRouter = Router()

playedSongsRouter.use(requireStudent, loadStudentProfile)

playedSongsRouter.get('/', async (request, response) => {
  const student = request.studentProfile!

  response.json({
    playedSongs: student.playedSongs
  })
})

export default playedSongsRouter
