import { Router } from 'express'
import {
  authenticateSession,
  requireTeacher,
  requireStudent
} from '../utils/session-helpers'
import Teacher from '../models/teacher'
import Student from '../models/student'
import Homework from '../models/homework'

const homeworkRouter = Router()

// POST /api/homework  (opettaja luo läksyn)
homeworkRouter.post('/', async (request, response) => {
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
  if (!student.teacher || student.teacher.toString() !== teacher.id) {
    return response
      .status(403)
      .json({ error: 'Student is not linked to this teacher' })
  }

  const homework = await Homework.create({
    teacher: teacher.id,
    student: student.id,
    songs,
    comment
  })
  response.status(201).json({
    ...homework.toJSON()
  })
})

// GET /api/homework  (oppilas näkee omat)
homeworkRouter.get('/', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireStudent(session, response)) return

  const student = await Student.findOne({ userId: session.user.id })
  if (!student)
    return response.status(404).json({ error: 'Student profile not found' })

  const homeworks = await Homework.find({ student: student.id })
    .sort({ createdAt: -1 })
  response.json({
    homework: homeworks
  })
})

// POST /api/homework/practice/:homeworkId  (oppilas kirjaa harjoituskerran)
homeworkRouter.post('/practice/:homeworkId', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireStudent(session, response)) return

  const student = await Student.findOne({ userId: session.user.id })
  if (!student)
    return response.status(404).json({ error: 'Student profile not found' })

  const homework = await Homework.findById(request.params.homeworkId)
  if (!homework)
    return response.status(404).json({ error: 'Homework not found' })
  if (homework.student.toString() !== student.id) {
    return response
      .status(403)
      .json({ error: 'Homework does not belong to this student' })
  }

  homework.practiceCount = (homework.practiceCount ?? 0) + 1
  await homework.save()
  response.json({ ...homework.toJSON() })
})

// DELETE /api/homework/:homeworkId (opettaja poistaa läksyn)
homeworkRouter.delete('/:homeworkId', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireTeacher(session, response)) return

  const teacher = await Teacher.findOne({ userId: session.user.id })
  if (!teacher)
    return response.status(404).json({ error: 'Teacher profile not found' })

  const homework = await Homework.findById(request.params.homeworkId)
  if (!homework)
    return response.status(404).json({ error: 'Homework not found' })
  if (homework.teacher.toString() !== teacher.id) {
    return response
      .status(403)
      .json({ error: 'Homework does not belong to this teacher' })
  }

  await Homework.findByIdAndDelete(request.params.homeworkId)
  response.status(204).send()
})

// PUT /api/homework/:homeworkId (opettaja päivittää läksyn)
homeworkRouter.put('/:homeworkId', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireTeacher(session, response)) return

  const { songs, comment } = request.body ?? {}
  if (songs !== undefined && !Array.isArray(songs))
    return response.status(400).json({ error: 'songs must be array' })

  const teacher = await Teacher.findOne({ userId: session.user.id })
  if (!teacher)
    return response.status(404).json({ error: 'Teacher profile not found' })

  const homework = await Homework.findById(request.params.homeworkId)
  if (!homework)
    return response.status(404).json({ error: 'Homework not found' })
  if (homework.teacher.toString() !== teacher.id) {
    return response
      .status(403)
      .json({ error: 'Homework does not belong to this teacher' })
  }

  if (songs !== undefined) homework.songs = songs
  if (comment !== undefined) homework.comment = comment
  
  await homework.save()
  response.json({ ...homework.toJSON() })
})

export default homeworkRouter
