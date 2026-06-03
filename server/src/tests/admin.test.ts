import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { TestHelper } from '../utils/testHelper'
import supertest from 'supertest'
import app from '../app'
import Teacher from '../models/teacher'
import Student from '../models/student'
import Homework from '../models/homework'
import Feedback from '../models/feedback'
import PopupMessage from '../models/popupMessage'

const api = supertest(app)

before(async () => {
  await TestHelper.setupTestDatabase()
})

beforeEach(async () => {
  await TestHelper.clearDatabase()
})

after(async () => {
  await TestHelper.cleanup()
})

describe('DELETE /api/admin/teachers/:teacherId', () => {
  it('should return 403 Forbidden for non-admin', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(api)

    const response = await api
      .delete('/api/admin/teachers/000000000000000000000000')
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Admin role required')
  })

  it('should return 404 when teacher not found', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)

    const response = await api
      .delete('/api/admin/teachers/000000000000000000000000')
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Teacher not found')
  })

  it('should return 204 and delete the teacher document', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)
    const { user: teacherUser } = await TestHelper.createAuthenticatedTeacher(api)
    const teacher = await Teacher.findOne({ userId: teacherUser.id })

    const response = await api
      .delete(`/api/admin/teachers/${teacher!.id}`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 204)
    const deletedTeacher = await Teacher.findById(teacher!.id)
    assert.strictEqual(deletedTeacher, null)
  })

  it('should unlink students from the deleted teacher', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)
    const { user: teacherUser } = await TestHelper.createAuthenticatedTeacher(api)
    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(api)

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    teacher!.students.push(student!.id)
    await student!.save()
    await teacher!.save()

    await api
      .delete(`/api/admin/teachers/${teacher!.id}`)
      .set('Cookie', sessionCookie)

    const updatedStudent = await Student.findById(student!.id)
    assert.strictEqual(updatedStudent!.teacher, null)
  })

  it('should not delete homework when teacher is deleted', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)
    const { user: teacherUser } = await TestHelper.createAuthenticatedTeacher(api)
    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(api)

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    await Homework.create({ teacher: teacher!.id, student: student!.id, songs: [] })

    await api
      .delete(`/api/admin/teachers/${teacher!.id}`)
      .set('Cookie', sessionCookie)

    const remainingHomework = await Homework.find({ student: student!.id })
    assert.strictEqual(remainingHomework.length, 1)
  })

  it('should delete the teacher Better Auth account', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)
    const { user: teacherUser, email, password } =
      await TestHelper.createAuthenticatedTeacher(api)
    const teacher = await Teacher.findOne({ userId: teacherUser.id })

    await api
      .delete(`/api/admin/teachers/${teacher!.id}`)
      .set('Cookie', sessionCookie)

    const signInResponse = await api
      .post('/api/auth/sign-in/email')
      .send({ email, password })

    assert.notStrictEqual(signInResponse.status, 200)
  })
})

describe('DELETE /api/admin/students/:studentId', () => {
  it('should return 403 Forbidden for non-admin', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(api)

    const response = await api
      .delete('/api/admin/students/000000000000000000000000')
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Admin role required')
  })

  it('should return 404 when student not found', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)

    const response = await api
      .delete('/api/admin/students/000000000000000000000000')
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Student not found')
  })

  it('should return 204 and delete the student document', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)
    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(api)
    const student = await Student.findOne({ userId: studentUser.id })

    const response = await api
      .delete(`/api/admin/students/${student!.id}`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 204)
    const deletedStudent = await Student.findById(student!.id)
    assert.strictEqual(deletedStudent, null)
  })

  it('should remove the student from the teacher students array', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)
    const { user: teacherUser } = await TestHelper.createAuthenticatedTeacher(api)
    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(api)

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    teacher!.students.push(student!.id)
    await student!.save()
    await teacher!.save()

    await api
      .delete(`/api/admin/students/${student!.id}`)
      .set('Cookie', sessionCookie)

    const updatedTeacher = await Teacher.findById(teacher!.id)
    assert.strictEqual(updatedTeacher!.students.length, 0)
  })

  it('should delete homework when student is deleted', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)
    const { user: teacherUser } = await TestHelper.createAuthenticatedTeacher(api)
    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(api)

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    await Homework.create({ teacher: teacher!.id, student: student!.id, songs: [] })

    await api
      .delete(`/api/admin/students/${student!.id}`)
      .set('Cookie', sessionCookie)

    const remainingHomework = await Homework.find({ student: student!.id })
    assert.strictEqual(remainingHomework.length, 0)
  })

  it('should delete the student Better Auth account', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)
    const { user: studentUser, email, password } =
      await TestHelper.createAuthenticatedStudent(api)
    const student = await Student.findOne({ userId: studentUser.id })

    await api
      .delete(`/api/admin/students/${student!.id}`)
      .set('Cookie', sessionCookie)

    const signInResponse = await api
      .post('/api/auth/sign-in/email')
      .send({ email, password })

    assert.notStrictEqual(signInResponse.status, 200)
  })
})
