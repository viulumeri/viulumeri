import { Router } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import { requireAdmin } from '../utils/auth-middleware'
import { auth } from '../utils/auth'
import Teacher from '../models/teacher'
import Student from '../models/student'
import Homework from '../models/homework'
import PopupMessage from '../models/popupMessage'

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

adminRouter.get('/popup-messages', async (_request, response) => {
  const messages = await PopupMessage.find().sort({ postedAt: -1 }).lean()

  response.json({
    messages: messages.map(message => ({
      id: (message as any)._id.toString(),
      title: (message as any).title,
      content: (message as any).content,
      postedAt: new Date((message as any).postedAt).toISOString(),
      isDraft: Boolean((message as any).isDraft)
    }))
  })
})

adminRouter.post('/popup-messages', async (request, response) => {
  const title =
    typeof request.body?.title === 'string' ? request.body.title.trim() : ''
  const content =
    typeof request.body?.content === 'string' ? request.body.content.trim() : ''
  const isDraft = request.body?.isDraft === true

  if (!title) {
    return response.status(400).json({ error: 'Title is required' })
  }
  if (!content) {
    return response.status(400).json({ error: 'Content is required' })
  }

  const doc = await PopupMessage.create({
    title,
    content,
    postedAt: new Date(),
    isDraft
  })

  response.status(201).json({
    message: {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      postedAt: doc.postedAt.toISOString(),
      isDraft: doc.isDraft
    }
  })
})

adminRouter.patch('/popup-messages/:messageId', async (request, response) => {
  const isDraft = request.body?.isDraft



  if (typeof isDraft !== 'boolean') {

    return response.status(400).json({ error: 'isDraft boolean is required' })
  }

  const doc = await PopupMessage.findById(request.params.messageId)

  if (!doc) {
    return response.status(404).json({ error: 'Popup message not found' })
  }

  const wasDraft = doc.isDraft

  doc.isDraft = isDraft

  if (wasDraft && !isDraft) {

    doc.postedAt = new Date()

  }

  await doc.save()



  response.json({
    message: {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      postedAt: doc.postedAt.toISOString(),
      isDraft: doc.isDraft
    }
  })
})

adminRouter.delete('/popup-messages/:messageId', async (request, response) => {
  const doc = await PopupMessage.findByIdAndDelete(request.params.messageId)

  if (!doc) {
    return response.status(404).json({ error: 'Popup message not found' })
  }

  response.status(204).send()
})

adminRouter.delete('/popup-messages', async (_request, response) => {
  await PopupMessage.deleteMany({})
  response.status(204).send()
})

export default adminRouter
