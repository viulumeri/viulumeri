import type { Request, Response } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from './auth'
import Teacher from '../models/teacher'
import Student from '../models/student'

export const authenticateSession = async (request: Request, response: Response) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers)
  })
  if (!session) {
    response.status(401).json({ error: 'Authentication required' })
    return null
  }
  return session
}

export const requireTeacher = (session: any, response: Response) => {
  if (session.user?.userType !== 'teacher') {
    response.status(403).json({ error: 'Teacher role required' })
    return false
  }
  return true
}

export const requireStudent = (session: any, response: Response) => {
  if (session.user?.userType !== 'student') {
    response.status(403).json({ error: 'Student role required' })
    return false
  }
  return true
}

export const validateTeacherProfile = async (session: any, response: Response) => {
  const teacher = await Teacher.findOne({ userId: session.user.id })
  if (!teacher) {
    response.status(404).json({ error: 'Teacher profile not found' })
    return null
  }
  return teacher
}

export const validateStudentProfile = async (session: any, response: Response) => {
  const student = await Student.findOne({ userId: session.user.id })
  if (!student) {
    response.status(404).json({ error: 'Student profile not found' })
    return null
  }
  return student
}

export const validateTeacherStudentRelationship = async (
  teacher: any,
  studentId: string,
  response: Response
) => {
  const student = await Student.findById(studentId)
  if (!student) {
    response.status(404).json({ error: 'Student not found' })
    return null
  }
  if (!student.teacher || student.teacher.toString() !== teacher.id) {
    response.status(403).json({ error: 'Student is not linked to this teacher' })
    return null
  }
  return student
}