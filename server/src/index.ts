import 'dotenv/config'
import { port } from './utils/config'
import connectDB from './db'
import { musicService } from './services/music'
import app from './app'
import logger from './utils/logger'
import { ensureAdminUser } from './utils/admin'

async function start() {
  await connectDB()
  musicService.initialize()

  try {
    const result = await ensureAdminUser()
    if (!result.ok) {
      console.warn('[admin bootstrap]', result.reason)
    } else {
      console.log(
        `[admin bootstrap] ok (collection=${result.collection}, promoted=${result.promoted})`
      )
    }
  } catch (error) {
    console.warn('[admin bootstrap] failed (non-fatal):', error)
  }

  app.listen(port, () => {
    logger.info(`Server running on port ${port}`)
  })
}

start()
