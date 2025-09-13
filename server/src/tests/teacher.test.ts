import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { TestHelper } from '../utils/testHelper'
import supertest from 'supertest'
import app from '../app'
import Teacher from '../models/teacher'
import Student from '../models/student'

const api = supertest(app)
const url = '/api/teacher'

before(async () => {
  await TestHelper.setupTestDatabase()
})

beforeEach(async () => {
  await TestHelper.clearDatabase()
})

after(async () => {
  await TestHelper.cleanup()
})

describe('Teacher API GET', () => {
  it('should return 401 Unauthorized without session', async () => {
    const response = await api.get(url)

    assert.strictEqual(response.status, 401)
    assert.strictEqual(response.body.error, 'Authentication required')
  })

  it('should return 403 Forbidden for a teacher', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'some.teacher@edu.hel.fi',
      'Some Teacher'
    )

    const response = await api.get(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Student role required')
  })

  it('should return 404 when student profile not found', async () => {
    const { user, sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'orphaned.student@edu.hel.fi',
      'Orphaned Student'
    )

    await Student.deleteOne({ userId: user.id })

    const response = await api.get(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Student profile not found')
  })

  it('should return 200 with null teacher when student has no teacher', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.without.teacher@edu.hel.fi',
      'Student Without Teacher'
    )

    const response = await api.get(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.teacher, null)
  })

  it('should return 200 with teacher info when student has a teacher', async () => {
    const { user: teacherUser } = await TestHelper.createAuthenticatedTeacher(
      api,
      'linked.teacher@edu.hel.fi',
      'Linked Teacher'
    )

    const { user: studentUser, sessionCookie } =
      await TestHelper.createAuthenticatedStudent(
        api,
        'student.with.teacher@edu.hel.fi',
        'Student With Teacher'
      )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    await student!.save()

    teacher!.students.push(student!.id)
    await teacher!.save()

    const response = await api.get(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.teacher.id, teacher!.id)
    assert.strictEqual(response.body.teacher.name, 'Linked Teacher')
  })
})

describe('Teacher API DELETE', () => {
  it('should return 401 Unauthorized without session', async () => {
    const response = await api.delete(url)

    assert.strictEqual(response.status, 401)
    assert.strictEqual(response.body.error, 'Authentication required')
  })

  it('should return 403 Forbidden for a teacher', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'some.teacher@edu.hel.fi',
      'Some Teacher'
    )

    const response = await api.delete(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Student role required')
  })

  it('should return 404 when student profile not found', async () => {
    const { user, sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'orphaned.student@edu.hel.fi',
      'Orphaned Student'
    )

    await Student.deleteOne({ userId: user.id })

    const response = await api.delete(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Student profile not found')
  })

  it('should return 204 when student has no teacher to remove', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.without.teacher@edu.hel.fi',
      'Student Without Teacher'
    )

    const response = await api.delete(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 204)
    assert.strictEqual(response.text, '')
  })

  it('should return 204 and remove teacher-student relationship', async () => {
    const { user: teacherUser } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.to.remove@edu.hel.fi',
      'Teacher To Remove'
    )

    const { user: studentUser, sessionCookie } =
      await TestHelper.createAuthenticatedStudent(
        api,
        'student.removing.teacher@edu.hel.fi',
        'Student Removing Teacher'
      )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    await student!.save()

    teacher!.students.push(student!.id)
    await teacher!.save()

    const linkedStudent = await Student.findById(student!.id)
    const linkedTeacher = await Teacher.findById(teacher!.id)
    assert.strictEqual(linkedStudent!.teacher!.toString(), teacher!.id)
    assert.strictEqual(linkedTeacher!.students.length, 1)

    const response = await api.delete(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 204)
    assert.strictEqual(response.text, '')

    const updatedStudent = await Student.findById(student!.id)
    const updatedTeacher = await Teacher.findById(teacher!.id)
    assert.strictEqual(updatedStudent!.teacher, null)
    assert.strictEqual(updatedTeacher!.students.length, 0)
  })

  it('should handle case when teacher record is deleted but student still references it', async () => {
    const { user: teacherUser } = await TestHelper.createAuthenticatedTeacher(
      api,
      'deleted.teacher@edu.hel.fi',
      'Deleted Teacher'
    )

    const { user: studentUser, sessionCookie } =
      await TestHelper.createAuthenticatedStudent(
        api,
        'student.with.deleted.teacher@edu.hel.fi',
        'Student With Deleted Teacher'
      )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    await student!.save()

    await Teacher.findByIdAndDelete(teacher!.id)

    const response = await api.delete(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 204)
    assert.strictEqual(response.text, '')

    const updatedStudent = await Student.findById(student!.id)
    assert.strictEqual(updatedStudent!.teacher, null)
  })
})

