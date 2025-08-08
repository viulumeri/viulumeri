import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { client } from '../db'
import { trustedOrigins } from './config'
import { sendEmail } from './email'
import logger from './logger'
import Teacher from '../models/teacher'
import Student from '../models/student'

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
  user: {
    additionalFields: {
      userType: {
        type: 'string',
        required: true
      }
    }
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
  databaseHooks: {
    user: {
      create: {
        after: async (user: any) => {
          try {
            if (user.userType === 'teacher') {
              const newTeacher = new Teacher({
                userId: user.id,
                name: user.name,
                email: user.email
              })
              await newTeacher.save()
              logger.info('Teacher profile created', { userId: user.id })
            } else {
              const newStudent = new Student({
                userId: user.id,
                name: user.name,
                email: user.email
              })
              await newStudent.save()
              logger.info('Student profile created', { userId: user.id })
            }
          } catch (error) {
            logger.error('Failed to create user profile', {
              userId: user.id,
              error
            })
            throw error
          }
        }
      }
    }
  },
  trustedOrigins
})

logger.info('Better-auth initialized successfully')
