import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { TestHelper } from '../utils/testHelper'
import supertest from 'supertest'
import app from '../app'
import Teacher from '../models/teacher'
import Student from '../models/student'
import Homework from '../models/homework'

const api = supertest(app)
const url = '/api/students'

before(async () => {
  await TestHelper.setupTestDatabase()
})

beforeEach(async () => {
  await TestHelper.clearDatabase()
})

after(async () => {
  await TestHelper.cleanup()
})

describe('Students API GET', () => {
  it('should return 401 Unauthorized without session', async () => {
    const response = await api.get(url)

    assert.strictEqual(response.status, 401)
    assert.strictEqual(response.body.error, 'Authentication required')
  })

  it('should return 403 Forbidden for a student', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'tauno.teststudent@edu.hel.fi',
      'Tauno Teststudent'
    )

    const response = await api.get(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Teacher role required')
  })

  it('should return 404 when teacher profile not found', async () => {
    const { user, sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'orphaned.teacher@edu.hel.fi',
      'Orphaned Teacher'
    )

    await Teacher.deleteOne({ userId: user.id })

    const response = await api.get(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Teacher profile not found')
  })

  it('should return 200 with empty student list for valid teacher', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'valid.teacher@edu.hel.fi',
      'Valid Teacher'
    )

    const response = await api.get(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert(Array.isArray(response.body.students))
    assert.strictEqual(response.body.students.length, 0)
  })

  it('should return 200 with linked students for valid teacher', async () => {
    const { user: teacherUser, sessionCookie } =
      await TestHelper.createAuthenticatedTeacher(
        api,
        'teacher.with.students@edu.hel.fi',
        'Teacher With Students'
      )

    const { user: student1User } = await TestHelper.createAuthenticatedStudent(
      api,
      'student1@edu.hel.fi',
      'Student One'
    )

    const { user: student2User } = await TestHelper.createAuthenticatedStudent(
      api,
      'student2@edu.hel.fi',
      'Student Two'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student1 = await Student.findOne({ userId: student1User.id })
    const student2 = await Student.findOne({ userId: student2User.id })

    student1!.teacher = teacher!.id
    student2!.teacher = teacher!.id
    await student1!.save()
    await student2!.save()

    teacher!.students.push(student1!.id, student2!.id)
    await teacher!.save()

    const response = await api.get(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert(Array.isArray(response.body.students))
    assert.strictEqual(response.body.students.length, 2)

    const returnedStudents = response.body.students
    assert(returnedStudents.every((s: any) => s.id && s.name))
    assert(returnedStudents.some((s: any) => s.name === 'Student One'))
    assert(returnedStudents.some((s: any) => s.name === 'Student Two'))
  })
})

describe('Students API GET /:studentId/homework', () => {
  const studentId = '507f1f77bcf86cd799439011'
  const homeworkUrl = `${url}/${studentId}/homework`

  it('should return 401 Unauthorized without session', async () => {
    const response = await api.get(homeworkUrl)

    assert.strictEqual(response.status, 401)
    assert.strictEqual(response.body.error, 'Authentication required')
  })

  it('should return 403 Forbidden for a student', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'tauno.teststudent@edu.hel.fi',
      'Tauno Teststudent'
    )

    const response = await api.get(homeworkUrl).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Teacher role required')
  })

  it('should return 404 when teacher profile not found', async () => {
    const { user, sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'orphaned.teacher@edu.hel.fi',
      'Orphaned Teacher'
    )

    await Teacher.deleteOne({ userId: user.id })

    const response = await api.get(homeworkUrl).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Teacher profile not found')
  })

  it('should return 404 when student not found', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'valid.teacher@edu.hel.fi',
      'Valid Teacher'
    )

    const response = await api.get(homeworkUrl).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Student not found')
  })

  it('should return 200 with empty homework list for valid teacher-student pair', async () => {
    const { user: teacherUser, sessionCookie } =
      await TestHelper.createAuthenticatedTeacher(
        api,
        'valid.teacher@edu.hel.fi',
        'Valid Teacher'
      )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'linked.student@edu.hel.fi',
      'Linked Student'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    await student!.save()

    teacher!.students.push(student!.id)
    await teacher!.save()

    const studentHomeworkUrl = `${url}/${student!._id}/homework`
    const response = await api
      .get(studentHomeworkUrl)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert(Array.isArray(response.body.homework))
    assert.strictEqual(response.body.homework.length, 0)
  })

  it('should return 200 with actual homework records for teacher-student pair', async () => {
    const { user: teacherUser, sessionCookie } =
      await TestHelper.createAuthenticatedTeacher(
        api,
        'teacher.with.homework@edu.hel.fi',
        'Teacher With Homework'
      )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.with.homework@edu.hel.fi',
      'Student With Homework'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    await student!.save()

    teacher!.students.push(student!.id)
    await teacher!.save()

    const homework1 = new Homework({
      teacher: teacher!.id,
      student: student!.id,
      songs: ['000-improvisaatio1', '001-hyppyhiiri'],
      comment: 'Muista pään asento.',
      practiceCount: 0
    })
    await homework1.save()

    const homework2 = new Homework({
      teacher: teacher!.id,
      student: student!.id,
      songs: ['002-jekku'],
      comment: 'Soita paremmin.',
      practiceCount: 2
    })
    await homework2.save()

    const studentHomeworkUrl = `${url}/${student!._id}/homework`
    const response = await api
      .get(studentHomeworkUrl)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert(Array.isArray(response.body.homework))
    assert.strictEqual(response.body.homework.length, 2)

    const homeworkList = response.body.homework
    assert(
      homeworkList.every(
        (h: any) => h.id && h.songs && typeof h.comment === 'string'
      )
    )
    // Check that order is right:
    assert(homeworkList[0].songs.includes('002-jekku'))
    assert.strictEqual(homeworkList[0].comment, 'Soita paremmin.')
    assert.strictEqual(homeworkList[0].practiceCount, 2)

    assert(homeworkList[1].songs.includes('000-improvisaatio1'))
    assert.strictEqual(homeworkList[1].comment, 'Muista pään asento.')
    assert.strictEqual(homeworkList[1].practiceCount, 0)
  })
})

describe('Students API GET /:studentId/played-songs', () => {
  it('should return 401 Unauthorized without session', async () => {
    const response = await api.get(`${url}/studentId/played-songs`)

    assert.strictEqual(response.status, 401)
    assert.strictEqual(response.body.error, 'Authentication required')
  })

  it('should return 403 Forbidden for a student', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'some.student@edu.hel.fi',
      'Some Student'
    )

    const response = await api
      .get(`${url}/studentId/played-songs`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Teacher role required')
  })

  it('should return 404 when teacher profile not found', async () => {
    const { user, sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'orphaned.teacher@edu.hel.fi',
      'Orphaned Teacher'
    )

    await Teacher.deleteOne({ userId: user.id })

    const response = await api
      .get(`${url}/studentId/played-songs`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Teacher profile not found')
  })

  it('should return 404 when student not found', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.no.student@edu.hel.fi',
      'Teacher No Student'
    )

    const response = await api
      .get(`${url}/507f1f77bcf86cd799439011/played-songs`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Student not found')
  })

  it('should return 403 when student not linked to teacher', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'unlinked.teacher@edu.hel.fi',
      'Unlinked Teacher'
    )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'unlinked.student@edu.hel.fi',
      'Unlinked Student'
    )

    const student = await Student.findOne({ userId: studentUser.id })

    const response = await api
      .get(`${url}/${student!.id}/played-songs`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Student is not linked to this teacher')
  })

  it('should return 200 with empty played songs for student with no played songs', async () => {
    const { user: teacherUser, sessionCookie } =
      await TestHelper.createAuthenticatedTeacher(
        api,
        'teacher.empty.songs@edu.hel.fi',
        'Teacher Empty Songs'
      )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.empty.songs@edu.hel.fi',
      'Student Empty Songs'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    await student!.save()
    teacher!.students.push(student!.id)
    await teacher!.save()

    const response = await api
      .get(`${url}/${student!.id}/played-songs`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.id, student!.id)
    assert.strictEqual(response.body.name, 'Student Empty Songs')
    assert(Array.isArray(response.body.playedSongs))
    assert.strictEqual(response.body.playedSongs.length, 0)
  })

  it('should return 200 with played songs for student with played songs', async () => {
    const { user: teacherUser, sessionCookie } =
      await TestHelper.createAuthenticatedTeacher(
        api,
        'teacher.with.songs@edu.hel.fi',
        'Teacher With Songs'
      )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.with.songs@edu.hel.fi',
      'Student With Songs'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    student!.playedSongs = ['song1', 'song2', 'song3']
    await student!.save()
    teacher!.students.push(student!.id)
    await teacher!.save()

    const response = await api
      .get(`${url}/${student!.id}/played-songs`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.id, student!.id)
    assert.strictEqual(response.body.name, 'Student With Songs')
    assert(Array.isArray(response.body.playedSongs))
    assert.strictEqual(response.body.playedSongs.length, 3)
    assert(response.body.playedSongs.includes('song1'))
    assert(response.body.playedSongs.includes('song2'))
    assert(response.body.playedSongs.includes('song3'))
  })
})

describe('Students API POST /:studentId/played-songs', () => {
  const studentId = '507f1f77bcf86cd799439011'
  const playedSongsUrl = `${url}/${studentId}/played-songs`

  it('should return 401 Unauthorized without session', async () => {
    const response = await api.post(playedSongsUrl).send({ songId: 'test-song' })

    assert.strictEqual(response.status, 401)
    assert.strictEqual(response.body.error, 'Authentication required')
  })

  it('should return 403 Forbidden for a student', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'tauno.teststudent@edu.hel.fi',
      'Tauno Teststudent'
    )

    const response = await api
      .post(playedSongsUrl)
      .set('Cookie', sessionCookie)
      .send({ songId: 'test-song' })

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Teacher role required')
  })

  it('should return 400 Bad Request when songId is missing', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'valid.teacher@edu.hel.fi',
      'Valid Teacher'
    )

    const response = await api
      .post(playedSongsUrl)
      .set('Cookie', sessionCookie)
      .send({})

    assert.strictEqual(response.status, 400)
    assert.strictEqual(response.body.error, 'songId required')
  })

  it('should return 404 when teacher profile not found', async () => {
    const { user, sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'orphaned.teacher@edu.hel.fi',
      'Orphaned Teacher'
    )

    await Teacher.deleteOne({ userId: user.id })

    const response = await api
      .post(playedSongsUrl)
      .set('Cookie', sessionCookie)
      .send({ songId: 'test-song' })

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Teacher profile not found')
  })

  it('should return 404 when student not found', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'valid.teacher@edu.hel.fi',
      'Valid Teacher'
    )

    const response = await api
      .post(playedSongsUrl)
      .set('Cookie', sessionCookie)
      .send({ songId: 'test-song' })

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Student not found')
  })

  it('should return 403 when student is not linked to teacher', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.without.student@edu.hel.fi',
      'Teacher Without Student'
    )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'unlinked.student@edu.hel.fi',
      'Unlinked Student'
    )

    const student = await Student.findOne({ userId: studentUser.id })
    const studentPlayedSongsUrl = `${url}/${student!._id}/played-songs`

    const response = await api
      .post(studentPlayedSongsUrl)
      .set('Cookie', sessionCookie)
      .send({ songId: 'test-song' })

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Student is not linked to this teacher')
  })

  it('should return 400 when song is already marked as played', async () => {
    const { user: teacherUser, sessionCookie } =
      await TestHelper.createAuthenticatedTeacher(
        api,
        'teacher.with.student@edu.hel.fi',
        'Teacher With Student'
      )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'linked.student@edu.hel.fi',
      'Linked Student'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    student!.playedSongs = ['already-played-song']
    await student!.save()

    teacher!.students.push(student!.id)
    await teacher!.save()

    const studentPlayedSongsUrl = `${url}/${student!._id}/played-songs`
    const response = await api
      .post(studentPlayedSongsUrl)
      .set('Cookie', sessionCookie)
      .send({ songId: 'already-played-song' })

    assert.strictEqual(response.status, 400)
    assert.strictEqual(response.body.error, 'Song already marked as played')
  })

  it('should successfully add song to played songs list', async () => {
    const { user: teacherUser, sessionCookie } =
      await TestHelper.createAuthenticatedTeacher(
        api,
        'teacher.adding.song@edu.hel.fi',
        'Teacher Adding Song'
      )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.receiving.song@edu.hel.fi',
      'Student Receiving Song'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    student!.playedSongs = ['existing-song']
    await student!.save()

    teacher!.students.push(student!.id)
    await teacher!.save()

    const studentPlayedSongsUrl = `${url}/${student!._id}/played-songs`
    const response = await api
      .post(studentPlayedSongsUrl)
      .set('Cookie', sessionCookie)
      .send({ songId: 'new-song' })

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.id, student!.id)
    assert.strictEqual(response.body.name, 'Student Receiving Song')
    assert(Array.isArray(response.body.playedSongs))
    assert.strictEqual(response.body.playedSongs.length, 2)
    assert(response.body.playedSongs.includes('existing-song'))
    assert(response.body.playedSongs.includes('new-song'))
  })
})

describe('Students API DELETE /:studentId/played-songs/:songId', () => {
  const studentId = '507f1f77bcf86cd799439011'
  const songId = 'test-song'
  const deletePlayedSongsUrl = `${url}/${studentId}/played-songs/${songId}`

  it('should return 401 Unauthorized without session', async () => {
    const response = await api.delete(deletePlayedSongsUrl)

    assert.strictEqual(response.status, 401)
    assert.strictEqual(response.body.error, 'Authentication required')
  })

  it('should return 403 Forbidden for a student', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'tauno.teststudent@edu.hel.fi',
      'Tauno Teststudent'
    )

    const response = await api
      .delete(deletePlayedSongsUrl)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Teacher role required')
  })

  it('should return 404 when teacher profile not found', async () => {
    const { user, sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'orphaned.teacher@edu.hel.fi',
      'Orphaned Teacher'
    )

    await Teacher.deleteOne({ userId: user.id })

    const response = await api
      .delete(deletePlayedSongsUrl)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Teacher profile not found')
  })

  it('should return 404 when student not found', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'valid.teacher@edu.hel.fi',
      'Valid Teacher'
    )

    const response = await api
      .delete(deletePlayedSongsUrl)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Student not found')
  })

  it('should return 403 when student is not linked to teacher', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.without.student@edu.hel.fi',
      'Teacher Without Student'
    )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'unlinked.student@edu.hel.fi',
      'Unlinked Student'
    )

    const student = await Student.findOne({ userId: studentUser.id })
    const studentDeleteUrl = `${url}/${student!._id}/played-songs/${songId}`

    const response = await api
      .delete(studentDeleteUrl)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Student is not linked to this teacher')
  })

  it('should return 404 when song not found in played songs', async () => {
    const { user: teacherUser, sessionCookie } =
      await TestHelper.createAuthenticatedTeacher(
        api,
        'teacher.with.student@edu.hel.fi',
        'Teacher With Student'
      )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'linked.student@edu.hel.fi',
      'Linked Student'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    student!.playedSongs = ['different-song']
    await student!.save()

    teacher!.students.push(student!.id)
    await teacher!.save()

    const studentDeleteUrl = `${url}/${student!._id}/played-songs/nonexistent-song`
    const response = await api
      .delete(studentDeleteUrl)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Song not found in played songs')
  })

  it('should successfully remove song from played songs list', async () => {
    const { user: teacherUser, sessionCookie } =
      await TestHelper.createAuthenticatedTeacher(
        api,
        'teacher.removing.song@edu.hel.fi',
        'Teacher Removing Song'
      )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.losing.song@edu.hel.fi',
      'Student Losing Song'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    student!.playedSongs = ['keep-song', 'remove-song', 'another-keep-song']
    await student!.save()

    teacher!.students.push(student!.id)
    await teacher!.save()

    const studentDeleteUrl = `${url}/${student!._id}/played-songs/remove-song`
    const response = await api
      .delete(studentDeleteUrl)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.id, student!.id)
    assert.strictEqual(response.body.name, 'Student Losing Song')
    assert(Array.isArray(response.body.playedSongs))
    assert.strictEqual(response.body.playedSongs.length, 2)
    assert(response.body.playedSongs.includes('keep-song'))
    assert(response.body.playedSongs.includes('another-keep-song'))
    assert(!response.body.playedSongs.includes('remove-song'))
  })
})
