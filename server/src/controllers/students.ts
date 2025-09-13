import { Router } from 'express'
import { 
  authenticateSession, 
  requireTeacher,
  validateTeacherProfile,
  validateTeacherStudentRelationship
} from '../utils/session-helpers'
import Homework from '../models/homework'

const studentsRouter = Router()

studentsRouter.get('/', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireTeacher(session, response)) return

  const teacher = await validateTeacherProfile(session, response)
  if (!teacher) return

  await teacher.populate('students', 'name')

  const students = (teacher.students as any[]).map(s => ({
    id: s.id,
    name: s.name
  }))

  response.json({ students })
})

// DELETE /api/students/:studentId
studentsRouter.delete('/:studentId', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireTeacher(session, response)) return

  const teacher = await validateTeacherProfile(session, response)
  if (!teacher) return

  const student = await validateTeacherStudentRelationship(
    teacher,
    request.params.studentId,
    response
  )
  if (!student) return

  // Remove student from teacher's student list
  teacher.students = teacher.students.filter(
    studentId => studentId.toString() !== student.id
  )
  await teacher.save()

  // Remove teacher from student's teacher field
  student.teacher = null as any
  await student.save()

  response.status(204).send()
})

// GET /api/students/:studentId/homework
studentsRouter.get('/:studentId/homework', async (request, response) => {
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireTeacher(session, response)) return

  const teacher = await validateTeacherProfile(session, response)
  if (!teacher) return

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
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireTeacher(session, response)) return

  const teacher = await validateTeacherProfile(session, response)
  if (!teacher) return

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
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireTeacher(session, response)) return

  const { songId } = request.body ?? {}
  if (!songId)
    return response.status(400).json({ error: 'songId required' })

  const teacher = await validateTeacherProfile(session, response)
  if (!teacher) return

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
  const session = await authenticateSession(request, response)
  if (!session) return
  if (!requireTeacher(session, response)) return

  const teacher = await validateTeacherProfile(session, response)
  if (!teacher) return

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

  student.playedSongs = student.playedSongs.filter(song => song !== songId)
  await student.save()

  response.json({
    id: student.id,
    name: student.name,
    playedSongs: student.playedSongs
  })
})

export default studentsRouter

