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

  const populatedTeacher = student.teacher as unknown as { id: string; name: string }
  response.json({
    teacher: {
      id: populatedTeacher.id,
      name: populatedTeacher.name
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
        studentId => studentId.toString() !== student.id
      )
      await teacher.save()
    }
  }

  student.teacher = null
  await student.save()

  response.status(204).send()
})
export default teacherRouter
