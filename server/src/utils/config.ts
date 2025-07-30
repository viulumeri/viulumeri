import 'dotenv/config'
import logger from './logger'

const port = process.env.PORT || 3001

const getCorsOrigin = (): string | boolean => {
  if (process.env.NODE_ENV === 'production') {
    return false // The origin is the same in production
  }
  return process.env.CLIENT_URL || 'http://localhost:5173'
}

const corsOrigin = getCorsOrigin()

const getDatabaseUrl = (): string | undefined => {
  switch (process.env.NODE_ENV) {
    case 'production':
      logger.info('Using production database.')
      return process.env.MONGODB_URI
    case 'test':
      return process.env.TEST_MONGODB_URI
    case 'development':
      logger.info('Using development database.')
      return process.env.MONGODB_URI
    default:
      logger.error('NODE_ENV is not set.')
      return undefined
  }
}

const databaseUrlResult = getDatabaseUrl()

if (!databaseUrlResult) {
  console.error('Database URL not set.')
  throw new Error('Database URL is required')
}

const databaseUrl: string = databaseUrlResult

export { databaseUrl, port, corsOrigin }
