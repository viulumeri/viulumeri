import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { client } from '../db'
import { trustedOrigins } from './config'
import { sendEmail } from './email'
import logger from './logger'
import Teacher from '../models/teacher'
import Student from '../models/student'
import Homework from '../models/homework'

logger.info('Initializing better-auth...')

client
  .db()
  .admin()
  .ping()
  .then(() => {
    logger.info('MongoDB client connected successfully')
  })
  .catch(err => {
    logger.error('MongoDB client connection failed:', err)
  })

export const auth = betterAuth({
  database: mongodbAdapter(client.db() as any),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.NODE_ENV !== 'test' // Disable email verification in tests
  },
  user: {
    additionalFields: {
      userType: {
        type: 'string',
        required: true
      }
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: 'Vahvista tilin poistaminen - Viulumeri',
          text: `Olet pyytänyt tilin poistamista Viulumeri-palvelussa.

Vahvista tilin poistaminen klikkaamalla alla olevaa linkkiä:
${url}

HUOM: Tämä toiminto on peruuttamaton ja kaikki tietosi poistetaan pysyvästi.

Jos et pyytänyt tilin poistamista, voit jättää tämän viestin huomioimatta.`
        })
      },
      beforeDelete: async user => {
        try {
          const teacher = await Teacher.findOne({ userId: user.id })
          if (teacher) {
            await Homework.deleteMany({ teacher: teacher.id })
            await Student.updateMany(
              { teacher: teacher.id },
              { $unset: { teacher: 1 } }
            )
            await Teacher.findByIdAndDelete(teacher.id)
            logger.info('Teacher profile and related data deleted', {
              userId: user.id
            })
          }

          const student = await Student.findOne({ userId: user.id })
          if (student) {
            await Homework.deleteMany({ student: student.id })
            await Student.findByIdAndDelete(student.id)
            logger.info('Student profile and related data deleted', {
              userId: user.id
            })
          }
        } catch (error) {
          logger.error('Failed to cleanup user data', {
            userId: user.id,
            error
          })
          throw error
        }
      }
    }
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
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
