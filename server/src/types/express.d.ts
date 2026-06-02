import type Teacher from '../models/teacher'
import type Student from '../models/student'

interface SessionUser {
  id: string
  email: string
  name: string
  userType: 'teacher' | 'student'
  role: 'admin' | 'user'
  emailVerified: boolean
}

declare global {
  namespace Express {
    interface Request {
      session?: { session: unknown; user: SessionUser } | null
      teacherProfile?: InstanceType<typeof Teacher>
      studentProfile?: InstanceType<typeof Student>
    }
  }
}

export {}
