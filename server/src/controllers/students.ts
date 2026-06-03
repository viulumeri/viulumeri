import { Router } from 'express'
import { requireTeacher, loadTeacherProfile } from '../utils/auth-middleware'
import { validateTeacherStudentRelationship } from '../utils/session-helpers'
import Homework from '../models/homework'
import { Types } from 'mongoose'

import type {} from '../types/express.d.ts'

interface PopulatedStudent {
  id: string
  _id: Types.ObjectId
  name: string
}

const studentsRouter = Router()

studentsRouter.use(requireTeacher, loadTeacherProfile)

studentsRouter.get('/', async (request, response) => {
  const teacher = request.teacherProfile!

  await teacher.populate('students', 'name')

  const populatedStudents = teacher.students as unknown as PopulatedStudent[]

  const students = await Promise.all(
    populatedStudents.map(async (s) => {
      const latestHomeworkDoc = await Homework.findOne({ student: s.id })
        .sort({ createdAt: -1 })
        .select('practiceCount')
        .lean()

      return {
        id: s.id,
        name: s.name,
        latestHomework: latestHomeworkDoc 
          ? { practiceCount: latestHomeworkDoc.practiceCount } 
          : null
      }
    })
  )

  response.json({ students })
})

// DELETE /api/students/:studentId
studentsRouter.delete('/:studentId', async (request, response) => {
  const teacher = request.teacherProfile!

  const student = await validateTeacherStudentRelationship(
    teacher,
    request.params.studentId,
    response
  )
  if (!student) return

  // Remove student from teacher's student list
  teacher.students = teacher.students.filter(
    (studentId) => studentId.toString() !== student.id
  )
  await teacher.save()

  // Remove teacher from student's teacher field
  student.teacher = null as unknown as Types.ObjectId
  await student.save()

  response.status(204).send()
})

// GET /api/students/:studentId/homework
studentsRouter.get('/:studentId/homework', async (request, response) => {
  const teacher = request.teacherProfile!

  const student = await validateTeacherStudentRelationship(
    teacher,
    request.params.studentId,
    response
  )
  if (!student) return

  const homeworks = await Homework.find({ student: student.id }).sort({
    createdAt: -1
  })

  response.json({
    homework: homeworks
  })
})

// GET /api/students/:studentId/played-songs
studentsRouter.get('/:studentId/played-songs', async (request, response) => {
  const teacher = request.teacherProfile!

  const student = await validateTeacherStudentRelationship(
    teacher,
    request.params.studentId,
    response
  )
  if (!student) return

  response.json({
    id: student.id,
    name: student.name,
    playedSongs: student.playedSongs
  })
})

// POST /api/students/:studentId/played-songs
studentsRouter.post('/:studentId/played-songs', async (request, response) => {
  const { songId } = request.body ?? {}
  if (!songId)
    return response.status(400).json({ error: 'songId required' })

  const teacher = request.teacherProfile!

  const student = await validateTeacherStudentRelationship(
    teacher,
    request.params.studentId,
    response
  )
  if (!student) return

  if (student.playedSongs.includes(songId)) {
    return response.status(400).json({ error: 'Song already marked as played' })
  }

  student.playedSongs.push(songId)
  await student.save()

  response.json({
    id: student.id,
    name: student.name,
    playedSongs: student.playedSongs
  })
})

// DELETE /api/students/:studentId/played-songs/:songId
studentsRouter.delete('/:studentId/played-songs/:songId', async (request, response) => {
  const teacher = request.teacherProfile!

  const student = await validateTeacherStudentRelationship(
    teacher,
    request.params.studentId,
    response
  )
  if (!student) return

  const songId = request.params.songId
  if (!student.playedSongs.includes(songId)) {
    return response.status(404).json({ error: 'Song not found in played songs' })
  }

  student.playedSongs = student.playedSongs.filter((song: string) => song !== songId)
  await student.save()

  response.json({
    id: student.id,
    name: student.name,
    playedSongs: student.playedSongs
  })
})

export default studentsRouter
