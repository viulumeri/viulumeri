import { Router } from 'express'
import { authenticateSession, requireTeacher } from '../utils/session-helpers'
import Teacher from '../models/teacher'
import Student from '../models/student'
import Homework from '../models/homework'

const studentsRouter = Router()

studentsRouter.get('/', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireTeacher(session, response)) return

  const teacher = await Teacher.findOne({ userId: session.user.id })
    .populate('students', 'name')
    .exec()

  if (!teacher) {
    return response.status(404).json({ error: 'Teacher profile not found' })
  }

  const students = (teacher.students as any[]).map(s => ({
    id: s.id,
    name: s.name
  }))

  response.json({ students })
})

// GET /api/students/:studentId/homework
studentsRouter.get('/:studentId/homework', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireTeacher(session, response)) return

  const teacher = await Teacher.findOne({ userId: session.user.id })
  if (!teacher)
    return response.status(404).json({ error: 'Teacher profile not found' })

  const student = await Student.findById(request.params.studentId)
  if (!student) return response.status(404).json({ error: 'Student not found' })
  if (!student.teacher || student.teacher.toString() !== teacher.id) {
    return response
      .status(403)
      .json({ error: 'Student is not linked to this teacher' })
  }

  const homeworks = await Homework.find({ student: student.id }).sort({
    createdAt: -1
  })

  response.json({
    homework: homeworks
  })
})

export default studentsRouter

