import { Router } from 'express'
import { requireStudent, authenticateSession } from '../utils/session-helpers'
import Student from '../models/student'
import Teacher from '../models/teacher'

const teacherRouter = Router()

// Route for student to get their teacher info
// GET /api/teacher
teacherRouter.get('/', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireStudent(session, response)) return

  const student = await Student.findOne({ userId: session.user.id }).populate('teacher', 'name')
  if (!student)
    return response.status(404).json({ error: 'Student profile not found' })

  if (!student.teacher) {
    return response.json({ teacher: null })
  }

  response.json({
    teacher: {
      id: (student.teacher as any).id,
      name: (student.teacher as any).name
    }
  })
})

// Route for student to remove teacher
// DELETE /api/teacher
teacherRouter.delete('/', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireStudent(session, response)) return

  const student = await Student.findOne({ userId: session.user.id })
  if (!student)
    return response.status(404).json({ error: 'Student profile not found' })

  if (student.teacher) {
    const teacher = await Teacher.findById(student.teacher)
    if (teacher) {
      teacher.students = teacher.students.filter(
        studentId => studentId.toString() !== student.id
      )
      await teacher.save()
    }
  }

  (student as any).teacher = null
  await student.save()

  response.status(204).send()
})
export default teacherRouter
