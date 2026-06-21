import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { TestHelper } from '../utils/testHelper'
import supertest from 'supertest'
import app from '../app'
import Teacher from '../models/teacher'
import Student from '../models/student'
import Homework from '../models/homework'
import { client } from '../db'
import { Faq } from '../models/FAQ'

const api = supertest(app)

const textBlock = (content: string, order = 0) => ({
  type: 'text',
  content,
  order
})

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

  it('should not allow an admin to delete their own profile', async () => {
    const { sessionCookie, user } =
      await TestHelper.createAuthenticatedAdmin(api)
    const teacher = await Teacher.findOne({ userId: user.id })

    const response = await api
      .delete(`/api/admin/teachers/${teacher!.id}`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'You cannot delete your own account')
    assert.ok(await Teacher.findById(teacher!.id))
  })

  it('should not allow an admin to delete another admin', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)
    const { user: targetAdmin, email } =
      await TestHelper.createAuthenticatedTeacher(api)
    await client
      .db()
      .collection('user')
      .updateOne({ email }, { $set: { role: 'admin' } })
    const teacher = await Teacher.findOne({ userId: targetAdmin.id })

    const response = await api
      .delete(`/api/admin/teachers/${teacher!.id}`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Admin users cannot be deleted')
    assert.ok(await Teacher.findById(teacher!.id))
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

  it('should not allow an admin to delete another admin', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)
    const { user: targetAdmin, email } =
      await TestHelper.createAuthenticatedStudent(api)
    await client
      .db()
      .collection('user')
      .updateOne({ email }, { $set: { role: 'admin' } })
    const student = await Student.findOne({ userId: targetAdmin.id })

    const response = await api
      .delete(`/api/admin/students/${student!.id}`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Admin users cannot be deleted')
    assert.ok(await Student.findById(student!.id))
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

describe('PATCH /api/admin/teachers/:teacherId', () => {
  it('updates the teacher profile and Better Auth account', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)
    const { user } = await TestHelper.createAuthenticatedTeacher(api)
    const teacher = await Teacher.findOne({ userId: user.id })

    const response = await api
      .patch(`/api/admin/teachers/${teacher!.id}`)
      .set('Cookie', sessionCookie)
      .send({ name: 'Updated Teacher', email: 'updated.teacher@example.com' })

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.user.name, 'Updated Teacher')
    assert.strictEqual(response.body.user.email, 'updated.teacher@example.com')

    const updatedTeacher = await Teacher.findById(teacher!.id)
    const authUser = await client
      .db()
      .collection('user')
      .findOne({ email: 'updated.teacher@example.com' })
    assert.strictEqual(updatedTeacher!.name, 'Updated Teacher')
    assert.strictEqual(updatedTeacher!.email, 'updated.teacher@example.com')
    assert.strictEqual(authUser!.name, 'Updated Teacher')
    assert.strictEqual(authUser!.email, 'updated.teacher@example.com')
  })

  it('rejects an email used by another profile', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)
    const { user: teacherUser } = await TestHelper.createAuthenticatedTeacher(api)
    const { user: studentUser, email: studentEmail } =
      await TestHelper.createAuthenticatedStudent(api)
    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    const response = await api
      .patch(`/api/admin/teachers/${teacher!.id}`)
      .set('Cookie', sessionCookie)
      .send({ name: 'Teacher', email: studentEmail })

    assert.strictEqual(response.status, 409)
    assert.strictEqual(response.body.error, 'Email is already in use')
    assert.notStrictEqual(teacher!.email, student!.email)
  })
})

describe('PATCH /api/admin/students/:studentId', () => {
  it('requires admin access', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(api)

    const response = await api
      .patch('/api/admin/students/000000000000000000000000')
      .set('Cookie', sessionCookie)
      .send({ name: 'Student', email: 'student@example.com' })

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Admin role required')
  })

  it('validates the submitted name and email', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)
    const { user } = await TestHelper.createAuthenticatedStudent(api)
    const student = await Student.findOne({ userId: user.id })

    const response = await api
      .patch(`/api/admin/students/${student!.id}`)
      .set('Cookie', sessionCookie)
      .send({ name: ' ', email: 'not-an-email' })

    assert.strictEqual(response.status, 400)
    assert.strictEqual(response.body.error, 'Name is required')
  })
})

describe('POST /api/auth/admin/impersonate-user', () => {
  it('requires admin access', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(api)
    const { user: studentUser } =
      await TestHelper.createAuthenticatedStudent(api)

    const response = await api
      .post('/api/auth/admin/impersonate-user')
      .set('Cookie', sessionCookie)
      .send({ userId: studentUser.id })

    assert.strictEqual(response.status, 403)
  })

  it('rejects a missing target user', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)

    const response = await api
      .post('/api/auth/admin/impersonate-user')
      .set('Cookie', sessionCookie)
      .send({ userId: 'missing-user-id' })

    assert.strictEqual(response.status, 404)
  })

  it('does not allow impersonating another admin', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)
    const { user: targetAdmin } =
      await TestHelper.createAuthenticatedTeacher(api)
    await client
      .db()
      .collection('user')
      .updateOne(
        { email: targetAdmin.email },
        { $set: { role: 'admin' } }
      )
    const targetProfile = await Teacher.findOne({ userId: targetAdmin.id })

    const response = await api
      .post('/api/auth/admin/impersonate-user')
      .set('Cookie', sessionCookie)
      .send({ userId: targetProfile!.userId })

    assert.strictEqual(response.status, 403)
  })

  it('creates an impersonation session for a regular user', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)
    const { user: studentUser } =
      await TestHelper.createAuthenticatedStudent(api)
    const student = await Student.findOne({ userId: studentUser.id })

    const response = await api
      .post('/api/auth/admin/impersonate-user')
      .set('Cookie', sessionCookie)
      .send({ userId: student!.userId })

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.user.id, studentUser.id)
    assert.ok(response.body.session.impersonatedBy)
    const setCookie = response.headers['set-cookie']
    assert.match(
      Array.isArray(setCookie) ? setCookie.join(';') : (setCookie ?? ''),
      /better-auth\.session_token=/
    )
    assert.match(
      Array.isArray(setCookie) ? setCookie.join(';') : (setCookie ?? ''),
      /better-auth\.admin_session=/
    )
  })
})

describe('FAQ admin endpoints', () => {
  it('allows an admin to create an FAQ', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)

    const response = await api
      .post('/api/admin/faq')
      .set('Cookie', sessionCookie)
      .send({
        question: 'Testikysymys?',
        blocks: [textBlock('Testivastaus.')]
      })

    assert.strictEqual(response.status, 201)
    assert.strictEqual(response.body.question, 'Testikysymys?')
    assert.strictEqual(response.body.blocks[0].content, 'Testivastaus.')

    const savedFaq = await Faq.findOne({ question: 'Testikysymys?' })
    assert.ok(savedFaq)
    assert.strictEqual(savedFaq.blocks[0].content, 'Testivastaus.')
  })

  it('allows an admin to update an FAQ', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)

    const created = await api
      .post('/api/admin/faq')
      .set('Cookie', sessionCookie)
      .send({
        question: 'Vanha kysymys',
        blocks: [textBlock('Vanha vastaus')]
      })

    const response = await api
      .put(`/api/admin/faq/${created.body._id}`)
      .set('Cookie', sessionCookie)
      .send({
        question: 'Uusi kysymys',
        blocks: [textBlock('Uusi vastaus')]
      })

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.question, 'Uusi kysymys')
    assert.strictEqual(response.body.blocks[0].content, 'Uusi vastaus')

    const updatedFaq = await Faq.findById(created.body._id)
    assert.ok(updatedFaq)
    assert.strictEqual(updatedFaq.question, 'Uusi kysymys')
    assert.strictEqual(updatedFaq.blocks[0].content, 'Uusi vastaus')
  })

  it('returns saved FAQs', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)

    await api
      .post('/api/admin/faq')
      .set('Cookie', sessionCookie)
      .send({
        question: 'Visible question',
        blocks: [textBlock('Visible answer')],
        order: 1
      })

    const response = await api
      .get('/api/faq')
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.length, 1)
    assert.strictEqual(response.body[0].question, 'Visible question')
    assert.strictEqual(response.body[0].blocks[0].content, 'Visible answer')
  })

  it('returns FAQs in order', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)

    await api
      .post('/api/admin/faq')
      .set('Cookie', sessionCookie)
      .send({
        question: 'Toinen kysymys',
        blocks: [textBlock('Toinen vastaus')],
        order: 2
      })

    await api
      .post('/api/admin/faq')
      .set('Cookie', sessionCookie)
      .send({
        question: 'First question',
        blocks: [textBlock('First answer')],
        order: 1
      })

    const response = await api
      .get('/api/faq')
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body[0].question, 'First question')
    assert.strictEqual(response.body[1].question, 'Toinen kysymys')
  })

  it('does not return deleted FAQs', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)

    const created = await api
      .post('/api/admin/faq')
      .set('Cookie', sessionCookie)
      .send({
        question: 'Poistettava kysymys',
        blocks: [textBlock('Poistettava vastaus')],
        order: 1
      })

    await api
      .delete(`/api/admin/faq/${created.body._id}`)
      .set('Cookie', sessionCookie)

    const response = await api
      .get('/api/faq')
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.length, 0)
  })

  it('returns an empty array when there are no FAQs', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(api)

    const response = await api
      .get('/api/faq')
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.deepStrictEqual(response.body, [])
  })
})
