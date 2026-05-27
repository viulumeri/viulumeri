import 'dotenv/config'
import { port } from './utils/config'
import connectDB from './db'
import { musicService } from './services/music'
import app from './app'
import logger from './utils/logger'
import { ensureAdminUser } from './utils/admin'

connectDB()

const isTestEnv = process.env.NODE_ENV === 'test'
const strictMusicScan = process.env.E2E_MUSIC_STRICT === 'true'

const isMissingDirError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false
  const maybeErrno = error as NodeJS.ErrnoException
  if (maybeErrno.code === 'ENOENT') return true
  if (error instanceof Error) {
    return (
      error.message.includes('ENOENT') ||
      error.message.includes('no such file or directory')
    )
  }
  return false
}

void musicService.initialize().catch(error => {
  if (isTestEnv && !strictMusicScan && isMissingDirError(error)) {
    logger.info('Music directory missing in test env; continuing with empty library')
    musicService.initializeEmpty()
    return
  }

  logger.error('Music service failed to initialize', error)
  process.exit(1)
})

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
