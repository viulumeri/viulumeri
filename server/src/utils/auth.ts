import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { client } from '../db'
import { trustedOrigins } from './config'
import { sendEmail } from './email'
import logger from './logger'

logger.info('Initializing better-auth...')

client
  .db('viulumeri')
  .admin()
  .ping()
  .then(() => {
    logger.info('MongoDB client connected successfully')
  })
  .catch(err => {
    logger.error('MongoDB client connection failed:', err)
  })

export const auth = betterAuth({
  database: mongodbAdapter(client.db('viulumeri') as any),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      await sendEmail({
        to: user.email,
        subject: 'Verify your email address',
        text: `Click the link to verify your email: ${url}`
      })
    }
  },
  trustedOrigins
})

logger.info('Better-auth initialized successfully')
