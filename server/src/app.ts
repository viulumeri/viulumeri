import express from 'express'
import cors from 'cors'
import connectDB from './utils/database'

const app = express()
connectDB()

app.use(cors())
app.use(express.json())

app.get('/ping', (req, res) => {
  res.send('pong')
})

export default app
