import { Router } from 'express'
import { authenticateSession, requireTeacher } from '../utils/session-helpers'
import Teacher from '../models/teacher'
import Student from '../models/student'
import Homework from '../models/homework'

const studentsRouter = Router()

studentsRouter.get('/', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireTeacher(session, response)) return

  const teacher = await Teacher.findOne({ userId: session.user.id })
    .populate('students', 'name')
    .exec()

  if (!teacher) {
    return response.status(404).json({ error: 'Teacher profile not found' })
  }

  const students = (teacher.students as any[]).map(s => ({
    id: s.id,
    name: s.name
  }))

  response.json({ students })
})

// GET /api/students/:studentId/homework
studentsRouter.get('/:studentId/homework', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireTeacher(session, response)) return

  const teacher = await Teacher.findOne({ userId: session.user.id })
  if (!teacher)
    return response.status(404).json({ error: 'Teacher profile not found' })

  const student = await Student.findById(request.params.studentId)
  if (!student) return response.status(404).json({ error: 'Student not found' })
  if (!student.teacher || student.teacher.toString() !== teacher.id) {
    return response
      .status(403)
      .json({ error: 'Student is not linked to this teacher' })
  }

  const homeworks = await Homework.find({ student: student.id }).sort({
    createdAt: -1
  })

  response.json({
    homework: homeworks
  })
})

// POST /api/students/:studentId/played-songs
studentsRouter.post('/:studentId/played-songs', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireTeacher(session, response)) return

  const { songId } = request.body ?? {}
  if (!songId)
    return response.status(400).json({ error: 'songId required' })

  const teacher = await Teacher.findOne({ userId: session.user.id })
  if (!teacher)
    return response.status(404).json({ error: 'Teacher profile not found' })

  const student = await Student.findById(request.params.studentId)
  if (!student) return response.status(404).json({ error: 'Student not found' })
  if (!student.teacher || student.teacher.toString() !== teacher.id) {
    return response
      .status(403)
      .json({ error: 'Student is not linked to this teacher' })
  }

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
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireTeacher(session, response)) return

  const teacher = await Teacher.findOne({ userId: session.user.id })
  if (!teacher)
    return response.status(404).json({ error: 'Teacher profile not found' })

  const student = await Student.findById(request.params.studentId)
  if (!student) return response.status(404).json({ error: 'Student not found' })
  if (!student.teacher || student.teacher.toString() !== teacher.id) {
    return response
      .status(403)
      .json({ error: 'Student is not linked to this teacher' })
  }

  const songId = request.params.songId
  const songIndex = student.playedSongs.indexOf(songId)
  if (songIndex === -1) {
    return response.status(404).json({ error: 'Song not found in played songs' })
  }

  student.playedSongs.splice(songIndex, 1)
  await student.save()

  response.json({
    id: student.id,
    name: student.name,
    playedSongs: student.playedSongs
  })
})

export default studentsRouter

