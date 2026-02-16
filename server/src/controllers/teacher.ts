/// <reference path="../types/express.d.ts" />
import { Router } from 'express'
import { requireStudent, loadStudentProfile } from '../utils/auth-middleware'
import Teacher from '../models/teacher'

const teacherRouter = Router()

teacherRouter.use(requireStudent, loadStudentProfile)

// Route for student to get their teacher info
// GET /api/teacher
teacherRouter.get('/', async (request, response) => {
  const student = request.studentProfile!

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
  const student = request.studentProfile!

  if (student.teacher) {
    const teacher = await Teacher.findById(student.teacher)
    if (teacher) {
      teacher.students = teacher.students.filter(
        (studentId: any) => studentId.toString() !== student.id
      )
      await teacher.save()
    }
  }

  student.teacher = null as any
  await student.save()

  response.status(204).send()
})
export default teacherRouter
