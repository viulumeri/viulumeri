import express from 'express'
import cors from 'cors'
import connectDB from './db'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './utils/auth'
import { corsOrigin } from './utils/config'
const middleware = require('./utils/middleware.ts')

const app = express()
connectDB()

app.use(
  cors({
    origin: corsOrigin,
    credentials: true
  })
)

app.use(middleware.requestLogger)

app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json())
app.get('/ping', (req, res) => {
  res.send('pong')
})

export default app
