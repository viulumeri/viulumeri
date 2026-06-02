export {}

declare global {
  namespace Express {
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
}
