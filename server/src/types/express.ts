import type { Request } from 'express'

declare module 'express-serve-static-core' {
  interface Request {
    session?: {
      session: unknown
      user: {
        id: string
        email: string
        name: string
        userType: string
        role?: string | null
        emailVerified: boolean
      }
    } | null
    teacherProfile?: InstanceType<typeof import('../models/teacher').default>
    studentProfile?: InstanceType<typeof import('../models/student').default>
  }
}

export type ExpressRequest = Request
