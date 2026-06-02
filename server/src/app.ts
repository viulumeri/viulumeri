import express from 'express'
import cors from 'cors'
import path from 'path'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './utils/auth'
import { corsOrigin } from './utils/config'
import { requestLogger } from './utils/middleware'
import { authenticate } from './utils/auth-middleware'
import songsRouter from './controllers/songs'
import inviteRouter from './controllers/invite'
import teacherRouter from './controllers/teacher'
import homeworkRouter from './controllers/homework'
import studentsRouter from './controllers/students'
import playedSongsRouter from './controllers/playedSongs'
import feedbackRouter from './controllers/feedback'
import adminRouter from './controllers/admin'
import popupMessagesRouter from './controllers/popupMessages'
import faqRouter from './controllers/faq'
import adminFaqRouter from './controllers/adminFaq'

const app = express()

app.use(
  cors({
    origin: corsOrigin,
    credentials: true
  })
)

if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger)
}

app.all('/api/auth/{*splat}', toNodeHandler(auth))

app.use(express.json())
app.use('/api', authenticate)
app.use('/api/popup-messages', popupMessagesRouter)
app.use('/api/songs', songsRouter)
app.use('/api/invites', inviteRouter)
app.use('/api/teacher', teacherRouter)
app.use('/api/homework', homeworkRouter)
app.use('/api/students', studentsRouter)
app.use('/api/played-songs', playedSongsRouter)
app.use('/api/admin', adminRouter)
app.use('/api/feedback', feedbackRouter)
app.use('/api/faq', faqRouter)
app.use('/api/admin/faq', adminFaqRouter)

app.get('/ping', (_req, res) => {
  res.send('pong')
})

const clientBuildPath = path.join(__dirname, '../../client/dist')
app.use(express.static(clientBuildPath))

app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(404).json({ message: 'Unknown endpoint!' })
    return
  }

  res.sendFile(path.join(clientBuildPath, 'index.html'))
})

export default app
