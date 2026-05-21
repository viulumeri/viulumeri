import 'dotenv/config'
import { port } from './utils/config'
import connectDB from './db'
import { musicService } from './services/music'
import app from './app'
import logger from './utils/logger'
import { ensureAdminUser } from './utils/admin'

const start = async () => {
  await connectDB()
  musicService.initialize()

  try {
    await ensureAdminUser()
  } catch (error) {
    logger.error('Failed to ensure admin user', { error })
    process.exit(1)
  }

  app.listen(port, () => {
    logger.info(`Server running on port ${port}`)
  })
}

start()
