import { Router } from 'express'
import type { Request, Response } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../utils/auth'
import Teacher from '../models/teacher'
import Student from '../models/student'
import Homework from '../models/homework'

const homeworkRouter = Router()

const authenticateSession = async (request: Request, response: Response) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers)
  })
  if (!session) {
    response.status(401).json({ error: 'Authentication required' })
    return null
  }
  return session
}
const requireTeacher = (session: any, response: Response) => {
  if (session.user?.userType !== 'teacher') {
    response.status(403).json({ error: 'Teacher role required' })
    return false
  }
  return true
}
const requireStudent = (session: any, response: Response) => {
  if (session.user?.userType !== 'student') {
    response.status(403).json({ error: 'Student role required' })
    return false
  }
  return true
}

// POST /api/teacher/homework  (opettaja luo läksyn)
homeworkRouter.post('/teacher/homework', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireTeacher(session, response)) return

  const { studentId, songs = [], comment = '' } = request.body ?? {}
  if (!studentId)
    return response.status(400).json({ error: 'studentId required' })
  if (!Array.isArray(songs))
    return response.status(400).json({ error: 'songs must be array' })

  const [teacher, student] = await Promise.all([
    Teacher.findOne({ userId: session.user.id }),
    Student.findById(studentId)
  ])
  if (!teacher)
    return response.status(404).json({ error: 'Teacher profile not found' })
  if (!student) return response.status(404).json({ error: 'Student not found' })
  if (
    !student.teacher ||
    student.teacher.toString() !== teacher._id.toString()
  ) {
    return response
      .status(403)
      .json({ error: 'Student is not linked to this teacher' })
  }

  const hw = await Homework.create({
    teacher: teacher._id,
    student: student._id,
    songs,
    comment
  })
  response.json({
    id: hw.id,
    student: { id: student.id, name: student.name },
    songs: hw.songs,
    comment: hw.comment,
    practiceCount: hw.practiceCount,
    createdAt: hw.createdAt
  })
})

// GET /api/student/homework  (oppilas näkee omat)
homeworkRouter.get('/student/homework', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireStudent(session, response)) return

  const student = await Student.findOne({ userId: session.user.id })
  if (!student)
    return response.status(404).json({ error: 'Student profile not found' })

  const list = await Homework.find({ student: student._id })
    .sort({ createdAt: -1 })
    .lean()
  const homeworks = list.map(hw => ({
    id: hw._id.toString(),
    student: { id: student.id, name: student.name },
    songs: hw.songs ?? [],
    comment: hw.comment ?? '',
    practiceCount: hw.practiceCount ?? 0,
    createdAt: hw.createdAt?.toISOString?.() ?? new Date().toISOString()
  }))
  response.json({
    homework: homeworks
  })
})

// POST /api/student/practice/:homeworkId  (oppilas kirjaa harjoituskerran)
homeworkRouter.post(
  '/student/practice/:homeworkId',
  async (request, response) => {
    const session = await authenticateSession(request, response)
    if (!session) return
    if (!requireStudent(session, response)) return

    const student = await Student.findOne({ userId: session.user.id })
    if (!student)
      return response.status(404).json({ error: 'Student profile not found' })

    const hw = await Homework.findById(request.params.homeworkId)
    if (!hw) return response.status(404).json({ error: 'Homework not found' })
    if (hw.student.toString() !== student._id.toString()) {
      return response
        .status(403)
        .json({ error: 'Homework does not belong to this student' })
    }

    hw.practiceCount = (hw.practiceCount ?? 0) + 1
    await hw.save()
    response.json({ id: hw.id, practiceCount: hw.practiceCount })
  }
)

// GET /api/teacher/students/:studentId/homework  (opettaja katsoo tietyn oppilaan)
homeworkRouter.get(
  '/teacher/students/:studentId/homework',
  async (request, response) => {
    const session = await authenticateSession(request, response)
    if (!session) return
    if (!requireTeacher(session, response)) return

    const teacher = await Teacher.findOne({ userId: session.user.id })
    if (!teacher)
      return response.status(404).json({ error: 'Teacher profile not found' })

    const student = await Student.findById(request.params.studentId)
    if (!student)
      return response.status(404).json({ error: 'Student not found' })
    if (
      !student.teacher ||
      student.teacher.toString() !== teacher._id.toString()
    ) {
      return response
        .status(403)
        .json({ error: 'Student is not linked to this teacher' })
    }

    const list = await Homework.find({ student: student._id })
      .sort({ createdAt: -1 })
      .lean()
    const homeworks = list.map(hw => ({
      id: hw._id.toString(),
      student: { id: student.id, name: student.name },
      songs: hw.songs ?? [],
      comment: hw.comment ?? '',
      practiceCount: hw.practiceCount ?? 0,
      createdAt: hw.createdAt?.toISOString?.() ?? new Date().toISOString()
    }))
    response.json({
      homework: homeworks
    })
  }
)

export default homeworkRouter
