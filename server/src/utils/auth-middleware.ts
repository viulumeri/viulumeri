/// <reference path="../types/express.d.ts" />
import type { Request, Response, NextFunction } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from './auth'
import Teacher from '../models/teacher'
import Student from '../models/student'

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers)
  })
  if (!session) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  req.session = session
  next()
}

export const requireTeacher = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.user?.userType !== 'teacher') {
    res.status(403).json({ error: 'Teacher role required' })
    return
  }
  next()
}

export const requireStudent = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.user?.userType !== 'student') {
    res.status(403).json({ error: 'Student role required' })
    return
  }
  next()
}

export const loadTeacherProfile = async (req: Request, res: Response, next: NextFunction) => {
  const teacher = await Teacher.findOne({ userId: req.session!.user.id })
  if (!teacher) {
    res.status(404).json({ error: 'Teacher profile not found' })
    return
  }
  req.teacherProfile = teacher
  next()
}

export const loadStudentProfile = async (req: Request, res: Response, next: NextFunction) => {
  const student = await Student.findOne({ userId: req.session!.user.id })
  if (!student) {
    res.status(404).json({ error: 'Student profile not found' })
    return
  }
  req.studentProfile = student
  next()
}
