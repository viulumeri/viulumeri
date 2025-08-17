import express from 'express'
import cors from 'cors'
import path from 'path'
import connectDB from './db'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './utils/auth'
import { corsOrigin } from './utils/config'
import { musicService } from './services/music'
import { requestLogger } from './utils/middleware'
import songsRouter from './controllers/songs'
import inviteRouter from './controllers/invite'

const app = express()

connectDB()
musicService.initialize()

app.use(
  cors({
    origin: corsOrigin,
    credentials: true
  })
)

app.use(requestLogger)

app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json())
app.use('/api/songs', songsRouter)
app.use('/api/invites', inviteRouter)
app.get('/ping', (_req, res) => {
  res.send('pong')
})

const clientBuildPath = path.join(__dirname, '../../client/dist')
app.use(express.static(clientBuildPath))

app.use((req, res, _next) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(404).json({ message: 'Unknown endpoint!' })
    return
  }

  res.sendFile(path.join(clientBuildPath, 'index.html'))
})

export default app
