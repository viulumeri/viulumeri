import { describe, test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import supertest from 'supertest'
import mongoose from 'mongoose'
import app from '../app'
import { TestHelper } from '../utils/testHelper'
import Teacher from '../models/teacher'
import Student from '../models/student'

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

describe('POST /api/invites', () => {
  test('should require authentication', async () => {
    const response = await api
      .post('/api/invites')
      .expect(401)

    assert.strictEqual(response.body.error, 'Authentication required')
  })

  test('should require teacher role', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(api)

    const response = await api
      .post('/api/invites')
      .set('Cookie', sessionCookie)
      .expect(403)

    assert.strictEqual(response.body.error, 'Teacher role required')
  })


  test('should create invite successfully for teacher', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(api)

    const response = await api
      .post('/api/invites')
      .set('Cookie', sessionCookie)
      .expect(200)

    assert(response.body.inviteUrl)
    assert(response.body.inviteUrl.includes('/invite/'))
    assert.strictEqual(response.body.expiresIn, '7 days')
  })
})

describe('GET /api/invites/:token', () => {
  test('should require authentication', async () => {
    const response = await api
      .get('/api/invites/invalidtoken')
      .expect(401)

    assert.strictEqual(response.body.error, 'Authentication required')
  })

  test('should reject invalid token', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(api)

    const response = await api
      .get('/api/invites/invalidtoken')
      .set('Cookie', sessionCookie)
      .expect(400)

    assert.strictEqual(response.body.error, 'Invalid or expired invitation')
  })

  test('should reject token for non-existent teacher', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(api)
    const nonExistentTeacherId = new mongoose.Types.ObjectId().toString()
    
    const { generateInviteToken } = await import('../utils/inviteToken')
    const token = generateInviteToken(nonExistentTeacherId)

    const response = await api
      .get(`/api/invites/${token}`)
      .set('Cookie', sessionCookie)
      .expect(404)

    assert.strictEqual(response.body.error, 'Teacher not found')
  })

  test('should return teacher info for valid token', async () => {
    const { sessionCookie: teacherCookie, user: teacherUser } = await TestHelper.createAuthenticatedTeacher(api)
    const { sessionCookie: studentCookie } = await TestHelper.createAuthenticatedStudent(api)

    const teacher = await Teacher.findOne({ userId: teacherUser.id })

    const inviteResponse = await api
      .post('/api/invites')
      .set('Cookie', teacherCookie)
      .expect(200)

    const token = inviteResponse.body.inviteUrl.split('/invite/')[1]

    const response = await api
      .get(`/api/invites/${token}`)
      .set('Cookie', studentCookie)
      .expect(200)

    assert.strictEqual(response.body.teacher.id, teacher.id)
    assert.strictEqual(response.body.teacher.name, teacher.name)
    assert.strictEqual(response.body.currentTeacher, null)
  })
})

describe('POST /api/invites/:token/accept', () => {
  test('should require authentication', async () => {
    const response = await api
      .post('/api/invites/invalidtoken/accept')
      .expect(401)

    assert.strictEqual(response.body.error, 'Authentication required')
  })

  test('should reject invalid token', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(api)

    const response = await api
      .post('/api/invites/invalidtoken/accept')
      .set('Cookie', sessionCookie)
      .expect(400)

    assert.strictEqual(response.body.error, 'Invalid or expired invitation')
  })

  test('should reject token for non-existent teacher', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(api)
    const nonExistentTeacherId = new mongoose.Types.ObjectId().toString()
    
    const { generateInviteToken } = await import('../utils/inviteToken')
    const token = generateInviteToken(nonExistentTeacherId)

    const response = await api
      .post(`/api/invites/${token}/accept`)
      .set('Cookie', sessionCookie)
      .expect(404)

    assert.strictEqual(response.body.error, 'Teacher not found')
  })


  test('should link student to teacher successfully', async () => {
    const { sessionCookie: teacherCookie, user: teacherUser } = await TestHelper.createAuthenticatedTeacher(api)
    const { sessionCookie: studentCookie, user: studentUser } = await TestHelper.createAuthenticatedStudent(api)

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    const inviteResponse = await api
      .post('/api/invites')
      .set('Cookie', teacherCookie)

    const token = inviteResponse.body.inviteUrl.split('/invite/')[1]

    const response = await api
      .post(`/api/invites/${token}/accept`)
      .set('Cookie', studentCookie)
      .expect(200)

    assert.strictEqual(response.body.teacher.id, teacher.id)
    assert.strictEqual(response.body.teacher.name, teacher.name)
    assert.strictEqual(response.body.changed, true)

    // Verify database state
    const updatedStudent = await Student.findById(student.id)
    const updatedTeacher = await Teacher.findById(teacher.id)
    
    assert(updatedStudent.teacher)
    assert.strictEqual(updatedStudent.teacher.toString(), teacher.id)
    assert(updatedTeacher.students.includes(student._id))
  })

  test('should return unchanged when student already linked to same teacher', async () => {
    const { sessionCookie: teacherCookie, user: teacherUser } = await TestHelper.createAuthenticatedTeacher(api)
    const { sessionCookie: studentCookie } = await TestHelper.createAuthenticatedStudent(api)

    const teacher = await Teacher.findOne({ userId: teacherUser.id })

    const inviteResponse = await api
      .post('/api/invites')
      .set('Cookie', teacherCookie)

    const token = inviteResponse.body.inviteUrl.split('/invite/')[1]

    // Accept invitation first time
    await api
      .post(`/api/invites/${token}/accept`)
      .set('Cookie', studentCookie)
      .expect(200)

    // Accept same invitation again
    const response = await api
      .post(`/api/invites/${token}/accept`)
      .set('Cookie', studentCookie)
      .expect(200)

    assert.strictEqual(response.body.teacher.id, teacher.id)
    assert.strictEqual(response.body.teacher.name, teacher.name)
    assert.strictEqual(response.body.changed, false)
  })

  test('should switch student from old teacher to new teacher', async () => {
    const { sessionCookie: oldTeacherCookie, user: oldTeacherUser } = await TestHelper.createAuthenticatedTeacher(api)
    const { sessionCookie: newTeacherCookie, user: newTeacherUser } = await TestHelper.createAuthenticatedTeacher(api)
    const { sessionCookie: studentCookie, user: studentUser } = await TestHelper.createAuthenticatedStudent(api)

    const oldTeacher = await Teacher.findOne({ userId: oldTeacherUser.id })
    const newTeacher = await Teacher.findOne({ userId: newTeacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    // Link to old teacher first
    const oldInviteResponse = await api
      .post('/api/invites')
      .set('Cookie', oldTeacherCookie)

    const oldToken = oldInviteResponse.body.inviteUrl.split('/invite/')[1]

    await api
      .post(`/api/invites/${oldToken}/accept`)
      .set('Cookie', studentCookie)

    // Now accept new teacher's invitation
    const newInviteResponse = await api
      .post('/api/invites')
      .set('Cookie', newTeacherCookie)

    const newToken = newInviteResponse.body.inviteUrl.split('/invite/')[1]

    const response = await api
      .post(`/api/invites/${newToken}/accept`)
      .set('Cookie', studentCookie)
      .expect(200)

    assert.strictEqual(response.body.teacher.id, newTeacher.id)
    assert.strictEqual(response.body.teacher.name, newTeacher.name)
    assert.strictEqual(response.body.changed, true)

    // Verify database state
    const updatedStudent = await Student.findById(student.id)
    const updatedOldTeacher = await Teacher.findById(oldTeacher.id)
    const updatedNewTeacher = await Teacher.findById(newTeacher.id)
    
    assert.strictEqual(updatedStudent.teacher.toString(), newTeacher.id)
    assert(!updatedOldTeacher.students.includes(student._id))
    assert(updatedNewTeacher.students.includes(student._id))
  })
})