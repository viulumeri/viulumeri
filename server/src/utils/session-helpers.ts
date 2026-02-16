import type { Response } from 'express'
import Student from '../models/student'
import Homework from '../models/homework'

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

export const validateHomeworkOwnershipByTeacher = async (
  teacher: any,
  homeworkId: string,
  response: Response
) => {
  const homework = await Homework.findById(homeworkId)
  if (!homework) {
    response.status(404).json({ error: 'Homework not found' })
    return null
  }
  if (homework.teacher.toString() !== teacher.id) {
    response.status(403).json({ error: 'Homework does not belong to this teacher' })
    return null
  }
  return homework
}

export const validateHomeworkOwnershipByStudent = async (
  student: any,
  homeworkId: string,
  response: Response
) => {
  const homework = await Homework.findById(homeworkId)
  if (!homework) {
    response.status(404).json({ error: 'Homework not found' })
    return null
  }
  if (homework.student.toString() !== student.id) {
    response.status(403).json({ error: 'Homework does not belong to this student' })
    return null
  }
  return homework
}
