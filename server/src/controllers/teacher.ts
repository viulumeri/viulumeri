import { Router } from 'express'
import { 
  requireStudent, 
  authenticateSession,
  validateStudentProfile 
} from '../utils/session-helpers'
import Teacher from '../models/teacher'

const teacherRouter = Router()

// Route for student to get their teacher info
// GET /api/teacher
teacherRouter.get('/', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireStudent(session, response)) return

  const student = await validateStudentProfile(session, response)
  if (!student) return

  await student.populate('teacher', 'name')

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

  const student = await validateStudentProfile(session, response)
  if (!student) return

  if (student.teacher) {
    const teacher = await Teacher.findById(student.teacher)
    if (teacher) {
      teacher.students = teacher.students.filter(
        studentId => studentId.toString() !== student.id
      )
      await teacher.save()
    }
  }

  student.teacher = null as any
  await student.save()

  response.status(204).send()
})
export default teacherRouter
