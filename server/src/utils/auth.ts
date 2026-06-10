import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { client } from '../db'
import { trustedOrigins } from './config'
import { sendEmail } from './email'
import logger from './logger'
import Teacher from '../models/teacher'
import Student from '../models/student'
import Homework from '../models/homework'
import { admin } from "better-auth/plugins"

type AuthUser = {
  id: string
  email: string
  emailVerified?: boolean
  name?: string
}

type AuthRequestLike = {
  url?: string
  headers?: unknown
}

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
  database: mongodbAdapter(client.db()),
  plugins:[
    admin()
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.NODE_ENV !== 'test', // Disable email verification in tests
    sendResetPassword:
      process.env.NODE_ENV !== 'test'
        ? async ({ user, url }) => {
            await sendEmail({
              to: user.email,
              subject: 'Salasanan palautus - Viulumeri',
              text: `Olet pyytänyt salasanan palautusta Viulumeri-palvelussa.

Klikkaa alla olevaa linkkiä vaihtaaksesi salasanasi:
${url}

Jos et pyytänyt salasanan palautusta, voit jättää tämän viestin huomioimatta.`
            })
          }
        : async ({ user }: { user: { id?: string; email?: string } }) => {
            // Test/E2E: enable the flow without sending email.
            logger.info('Password reset requested (test/E2E)', {
              userId: user?.id,
              email: user?.email
            })
          },
    onPasswordReset: async ({ user }: { user: AuthUser }) => {
      logger.info('Password reset completed', { userId: user.id, email: user.email })
    }
  },
  user: {
    additionalFields: {
      userType: {
        type: 'string',
        required: true
      },
/*       userRole: {
        type: ["user", "admin"],
        required: false,
        defaultValue: "user",
        input: false, // don't allow user to set role
      }, */
      role: {
        type: ["user", "admin"],
        required: false,
        defaultValue: "user",
        input: false, // don't allow user to set role
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification:
        process.env.NODE_ENV !== 'test'
          ? async ({ user, url }) => {
              await sendEmail({
                to: user.email,
                subject: 'Vahvista tilin poistaminen - Viulumeri',
                text: `Olet pyytänyt tilin poistamista Viulumeri-palvelussa.

Vahvista tilin poistaminen klikkaamalla alla olevaa linkkiä:
${url}

HUOM: Tämä toiminto on peruuttamaton ja kaikki tietosi poistetaan pysyvästi.

Jos et pyytänyt tilin poistamista, voit jättää tämän viestin huomioimatta.`
              })
            }
          : undefined,
      beforeDelete: async (user: AuthUser) => {
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
    sendOnSignUp: process.env.NODE_ENV !== 'test' && process.env.E2E_SEED !== 'true',
    sendOnSignIn: process.env.NODE_ENV !== 'test' && process.env.E2E_SEED !== 'true',
    autoSignInAfterVerification: true,
    sendVerificationEmail: process.env.NODE_ENV !== 'test' && process.env.E2E_SEED !== 'true'
      ? async ({ user, url }) => {
      logger.info('Sending verification email', {
        userId: user.id,
        email: user.email,
        verificationUrl: url
      })
      await sendEmail({
        to: user.email,
        subject: 'Vahvista sähköpostiosoitteesi - Viulumeri',
        text: `Tervetuloa Viulumeri-palveluun!

Klikkaa alla olevaa linkkiä vahvistaaksesi sähköpostiosoitteesi:
${url}

Jos et rekisteröitynyt Viulumeri-palveluun, voit jättää tämän viestin huomioimatta.`
      })
      logger.info('Verification email sent successfully', { userId: user.id, email: user.email })
    }
      : undefined,
    async afterEmailVerification(user: AuthUser, request: AuthRequestLike) {
  logger.info('Email verification completed successfully', {
    userId: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    requestUrl: request?.url,
    requestHeaders: request?.headers
  })
  }
},
  databaseHooks: {
    user: {
      create: {
        after: async (rawUser) => {
          const user = rawUser as typeof rawUser & { userType: 'teacher' | 'student' | 'admin' }
          try {
            if (user.userType === 'teacher') {
              const newTeacher = new Teacher({
                userId: user.id,
                name: user.name,
                email: user.email
              })
              await newTeacher.save()
              logger.info('Teacher profile created', { userId: user.id })
            } else if (user.userType === 'student') {
              const newStudent = new Student({
                userId: user.id,
                name: user.name,
                email: user.email
              })
              await newStudent.save()
              logger.info('Student profile created', { userId: user.id })
            } else if (user.userType === 'admin') {
              logger.info('Admin account created', { userId: user.id })
            } else {
              throw new Error(`Unsupported userType: ${user.userType}`)
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
