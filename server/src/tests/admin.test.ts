import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { TestHelper } from '../utils/testHelper'
import supertest from 'supertest'
import app from '../app'
import Teacher from '../models/teacher'
import Student from '../models/student'
import Homework from '../models/homework'
import Feedback from '../models/feedback'

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

describe('GET /api/admin/feedbacks', () => {
  it('should return 401 for unauthenticated request', async () => {
    const response = await api.get('/api/admin/feedbacks')

    assert.strictEqual(response.status, 401)
  })

  it('should return 403 for non-admin', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(api)

    const response = await api
      .get('/api/admin/feedbacks')
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Admin role required')
  })

  it('should return empty array when there are no feedbacks', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)

    const response = await api
      .get('/api/admin/feedbacks')
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.deepStrictEqual(response.body.feedbacks, [])
  })

  it('should return feedbacks with sender info for admin', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)
    const { user: teacherUser } = await TestHelper.createAuthenticatedTeacher(api)
    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    assert.ok(teacher, 'Teacher profile should exist after registration')

    await Feedback.create({
      userId: teacherUser.id,
      userType: 'teacher',
      title: 'Test feedback',
      category: 'bug',
      message: 'Something is broken'
    })

    const response = await api
      .get('/api/admin/feedbacks')
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.feedbacks.length, 1)

    const item = response.body.feedbacks[0]
    assert.strictEqual(item.title, 'Test feedback')
    assert.strictEqual(item.category, 'bug')
    assert.strictEqual(item.message, 'Something is broken')
    assert.strictEqual(item.senderName, teacher.name)
    assert.strictEqual(item.senderEmail, teacher.email)
    assert.strictEqual(item.userType, 'teacher')
    assert.ok(item.createdAt)
  })

  it('should return feedbacks sorted newest first', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)
    const { user: teacherUser } = await TestHelper.createAuthenticatedTeacher(api)

    await Feedback.create({
      userId: teacherUser.id,
      userType: 'teacher',
      title: 'Older feedback',
      category: 'other',
      message: 'This came first',
      createdAt: new Date('2024-01-01T10:00:00Z')
    })
    await Feedback.create({
      userId: teacherUser.id,
      userType: 'teacher',
      title: 'Newer feedback',
      category: 'feature',
      message: 'This came second',
      createdAt: new Date('2024-06-01T10:00:00Z')
    })

    const response = await api
      .get('/api/admin/feedbacks')
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.body.feedbacks[0].title, 'Newer feedback')
    assert.strictEqual(response.body.feedbacks[1].title, 'Older feedback')
  })

  it('should use fallback values for deleted user', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)

    await Feedback.create({
      userId: 'nonexistent-user-id',
      userType: 'teacher',
      title: 'Orphaned feedback',
      category: 'other',
      message: 'User was deleted'
    })

    const response = await api
      .get('/api/admin/feedbacks')
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    const item = response.body.feedbacks[0]
    assert.strictEqual(item.senderName, 'Poistettu käyttäjä')
    assert.strictEqual(item.senderEmail, '')
  })
})
