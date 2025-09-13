import { Router } from 'express'
import {
  authenticateSession,
  requireTeacher,
  requireStudent,
  validateTeacherProfile,
  validateStudentProfile,
  validateTeacherStudentRelationship,
  validateHomeworkOwnershipByTeacher,
  validateHomeworkOwnershipByStudent
} from '../utils/session-helpers'
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

  const teacher = await validateTeacherProfile(session, response)
  if (!teacher) return

  const student = await validateTeacherStudentRelationship(teacher, studentId, response)
  if (!student) return

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

  const student = await validateStudentProfile(session, response)
  if (!student) return

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

  const student = await validateStudentProfile(session, response)
  if (!student) return

  const homework = await validateHomeworkOwnershipByStudent(student, request.params.homeworkId, response)
  if (!homework) return

  homework.practiceCount = (homework.practiceCount ?? 0) + 1
  await homework.save()
  response.json({ ...homework.toJSON() })
})

// DELETE /api/homework/:homeworkId (opettaja poistaa läksyn)
homeworkRouter.delete('/:homeworkId', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireTeacher(session, response)) return

  const teacher = await validateTeacherProfile(session, response)
  if (!teacher) return

  const homework = await validateHomeworkOwnershipByTeacher(teacher, request.params.homeworkId, response)
  if (!homework) return

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

  const teacher = await validateTeacherProfile(session, response)
  if (!teacher) return

  const homework = await validateHomeworkOwnershipByTeacher(teacher, request.params.homeworkId, response)
  if (!homework) return

  if (songs !== undefined) homework.songs = songs
  if (comment !== undefined) homework.comment = comment
  
  await homework.save()
  response.json({ ...homework.toJSON() })
})

export default homeworkRouter
