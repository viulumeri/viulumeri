import express from 'express'
import cors from 'cors'
import path from 'path'
import connectDB from './db'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './utils/auth'
import { corsOrigin } from './utils/config'
import { musicService } from './services/music'
const middleware = require('./utils/middleware.ts')
import songsRouter from './controllers/songs'

const app = express()

connectDB()
musicService.initialize()

app.use(
  cors({
    origin: corsOrigin,
    credentials: true
  })
)

app.use(middleware.requestLogger)

app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json())
app.use('/api/songs', songsRouter)
app.get('/ping', (req, res) => {
  res.send('pong')
})

const clientBuildPath = path.join(__dirname, '../../client/dist')
app.use(express.static(clientBuildPath))

app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(404).json({ message: 'Unknown endpoint!' })
    return
  }

  res.sendFile(path.join(clientBuildPath, 'index.html'))
})

export default app
