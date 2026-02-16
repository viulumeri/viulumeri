/// <reference path="../types/express.d.ts" />
import { Router } from 'express'
import {
  requireTeacher,
  requireStudent,
  loadTeacherProfile,
  loadStudentProfile
} from '../utils/auth-middleware'
import {
  validateTeacherStudentRelationship,
  validateHomeworkOwnershipByTeacher,
  validateHomeworkOwnershipByStudent
} from '../utils/session-helpers'
import Homework from '../models/homework'

const homeworkRouter = Router()

// POST /api/homework  (opettaja luo läksyn)
homeworkRouter.post('/', requireTeacher, loadTeacherProfile, async (request, response) => {
  const { studentId, songs = [], comment = '' } = request.body ?? {}
  if (!studentId)
    return response.status(400).json({ error: 'studentId required' })
  if (!Array.isArray(songs))
    return response.status(400).json({ error: 'songs must be array' })

  const teacher = request.teacherProfile!

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
homeworkRouter.get('/', requireStudent, loadStudentProfile, async (request, response) => {
  const student = request.studentProfile!

  const homeworks = await Homework.find({ student: student.id })
    .sort({ createdAt: -1 })
  response.json({
    homework: homeworks
  })
})

// POST /api/homework/practice/:homeworkId  (oppilas kirjaa harjoituskerran)
homeworkRouter.post('/practice/:homeworkId', requireStudent, loadStudentProfile, async (request, response) => {
  const student = request.studentProfile!

  const homework = await validateHomeworkOwnershipByStudent(student, request.params.homeworkId, response)
  if (!homework) return

  homework.practiceCount = (homework.practiceCount ?? 0) + 1
  await homework.save()
  response.json({ ...homework.toJSON() })
})

// DELETE /api/homework/:homeworkId (opettaja poistaa läksyn)
homeworkRouter.delete('/:homeworkId', requireTeacher, loadTeacherProfile, async (request, response) => {
  const teacher = request.teacherProfile!

  const homework = await validateHomeworkOwnershipByTeacher(teacher, request.params.homeworkId, response)
  if (!homework) return

  await Homework.findByIdAndDelete(request.params.homeworkId)
  response.status(204).send()
})

// PUT /api/homework/:homeworkId (opettaja päivittää läksyn)
homeworkRouter.put('/:homeworkId', requireTeacher, loadTeacherProfile, async (request, response) => {
  const { songs, comment } = request.body ?? {}
  if (songs !== undefined && !Array.isArray(songs))
    return response.status(400).json({ error: 'songs must be array' })

  const teacher = request.teacherProfile!

  const homework = await validateHomeworkOwnershipByTeacher(teacher, request.params.homeworkId, response)
  if (!homework) return

  if (songs !== undefined) homework.songs = songs
  if (comment !== undefined) homework.comment = comment

  await homework.save()
  response.json({ ...homework.toJSON() })
})

export default homeworkRouter
