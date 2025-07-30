import 'dotenv/config'

const port = process.env.PORT || 3001

const getDatabaseUrl = (): string | undefined => {
  switch (process.env.NODE_ENV) {
    case 'production':
      console.log('Using production database.')
      return process.env.MONGODB_URI
    case 'test':
      return process.env.TEST_MONGODB_URI
    case 'development':
      console.log('Using development database.')
      return process.env.MONGODB_URI
    default:
      console.error('NODE_ENV is not set.')
      return undefined
  }
}

const databaseUrlResult = getDatabaseUrl()

if (!databaseUrlResult) {
  console.error('Database URL not set.')
  throw new Error('Database URL is required')
}

const databaseUrl: string = databaseUrlResult

export { databaseUrl, port }
