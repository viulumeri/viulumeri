import type { Request } from 'express'

declare module 'express-serve-static-core' {
  interface Request {
    session?: {
      session: import('../utils/auth').AuthSession['session']
      user: import('../utils/auth').AuthSession['user']
    } | null
    teacherProfile?: InstanceType<typeof import('../models/teacher').default>
    studentProfile?: InstanceType<typeof import('../models/student').default>
  }
}

export type ExpressRequest = Request
