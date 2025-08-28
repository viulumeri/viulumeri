import 'dotenv/config'
import { port } from './utils/config'
import connectDB from './db'
import { musicService } from './services/music'
import app from './app'
import logger from './utils/logger'

connectDB()
musicService.initialize()

app.listen(port, () => {
  logger.info(`Server running on port ${port}`)
})
