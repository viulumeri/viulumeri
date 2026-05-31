/// <reference path="../types/express.d.ts" />
import { Router } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import { requireAdmin } from '../utils/auth-middleware'
import { auth } from '../utils/auth'
import Teacher from '../models/teacher'
import Student from '../models/student'
import Homework from '../models/homework'
import PopupMessage from '../models/popupMessage'
import Feedback from '../models/feedback'

const adminRouter = Router()
adminRouter.use(requireAdmin)

adminRouter.get('/summary', async (_request, response) => {
  const teacherCount = await Teacher.countDocuments()
  const studentCount = await Student.countDocuments()
  const homeworkCount = await Homework.countDocuments()

  response.json({ teacherCount, studentCount, homeworkCount })
})

adminRouter.get('/teachers', async (_request, response) => {
  const teachers = await Teacher.find().populate('students', 'name email')

  const result = teachers.map(teacher => ({
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    studentCount: (teacher.students as any[]).length,
    students: (teacher.students as any[]).map(student => ({
      id: student.id,
      name: student.name,
      email: student.email
    }))
  }))

  response.json({ teachers: result })
})

adminRouter.get('/students', async (_request, response) => {
  const students = await Student.find().populate('teacher', 'name email')

  const result = students.map(student => ({
    id: student.id,
    name: student.name,
    email: student.email,
    playedSongs: student.playedSongs,
    teacher: student.teacher
      ? {
          id: (student.teacher as any).id,
          name: (student.teacher as any).name,
          email: (student.teacher as any).email
        }
      : null
  }))

  response.json({ students: result })
})

adminRouter.delete('/teachers/:teacherId', async (request, response) => {
  const teacher = await Teacher.findById(request.params.teacherId)
  if (!teacher) {
    return response.status(404).json({ error: 'Teacher not found' })
  }

  await auth.api.removeUser({
    body: { userId: teacher.userId },
    headers: fromNodeHeaders(request.headers)
  })
  await Student.updateMany(
    { teacher: teacher.id },
    { $unset: { teacher: 1 } }
  )
  await teacher.deleteOne()

  response.status(204).send()
})

adminRouter.delete('/students/:studentId', async (request, response) => {
  const student = await Student.findById(request.params.studentId)
  if (!student) {
    return response.status(404).json({ error: 'Student not found' })
  }

  if (student.teacher) {
    const teacher = await Teacher.findById(student.teacher)
    if (teacher) {
      teacher.students = teacher.students.filter(
        (studentId: any) => studentId.toString() !== student.id
      )
      await teacher.save()
    }
  }

  await auth.api.removeUser({
    body: { userId: student.userId },
    headers: fromNodeHeaders(request.headers)
  })
  await Homework.deleteMany({ student: student.id })
  await student.deleteOne()

  response.status(204).send()
})

adminRouter.post('/popup-messages', async (request, response) => {
  const title =
    typeof request.body?.title === 'string' ? request.body.title.trim() : ''
  const content =
    typeof request.body?.content === 'string' ? request.body.content.trim() : ''

  if (!title) {
    return response.status(400).json({ error: 'Title is required' })
  }
  if (!content) {
    return response.status(400).json({ error: 'Content is required' })
  }

  const doc = await PopupMessage.create({
    title,
    content,
    postedAt: new Date()
  })

  response.status(201).json({
    message: {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      postedAt: doc.postedAt.toISOString()
    }
  })
})

adminRouter.delete('/popup-messages', async (_request, response) => {
  await PopupMessage.deleteMany({})
  response.status(204).send()
})

adminRouter.get('/feedbacks', async (_request, response) => {
  const feedbacks = await Feedback.find().sort({ createdAt: -1 })

  const teacherUserIds = feedbacks
    .filter(f => f.userType === 'teacher')
    .map(f => f.userId)
  const studentUserIds = feedbacks
    .filter(f => f.userType === 'student')
    .map(f => f.userId)

  const [teachers, students] = await Promise.all([
    Teacher.find({ userId: { $in: teacherUserIds } }, 'userId name email'),
    Student.find({ userId: { $in: studentUserIds } }, 'userId name email')
  ])

  const userMap = new Map<string, { name: string; email: string }>()
  for (const t of teachers) userMap.set(t.userId, { name: t.name, email: t.email })
  for (const s of students) userMap.set(s.userId, { name: s.name, email: s.email })

  const result = feedbacks.map(f => {
    const user = userMap.get(f.userId)
    return {
      id: f.id,
      title: f.title,
      category: f.category,
      message: f.message,
      senderName: user?.name ?? 'Poistettu käyttäjä',
      senderEmail: user?.email ?? '',
      userType: f.userType,
      createdAt: (f.createdAt as Date).toISOString()
    }
  })

  response.json({ feedbacks: result })
})

export default adminRouter
