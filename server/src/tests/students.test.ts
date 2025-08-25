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
    assert.strictEqual(homeworkList[0].comment, 'Soita paremmin')
    assert.strictEqual(homeworkList[0].practiceCount, 2)

    assert(homeworkList[1].songs.includes('000-improvisaatio1'))
    assert.strictEqual(homeworkList[1].comment, 'Muista pään asento.')
    assert.strictEqual(homeworkList[1].practiceCount, 0)
  })
})
