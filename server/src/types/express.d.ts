declare global {
  namespace Express {
    interface Request {
      session?: { session: any; user: any } | null
      teacherProfile?: any
      studentProfile?: any
    }
  }
}

export {}
