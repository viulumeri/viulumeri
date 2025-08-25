import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { TestHelper } from '../utils/testHelper'
import Teacher from '../models/teacher'
import Student from '../models/student'
import supertest from 'supertest'
import app from '../app'

describe('Auth Integration Tests', () => {
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

  describe('Better Auth Integration', () => {
    it('should create authenticated teacher with valid session and profile', async () => {
      const result = await TestHelper.createAuthenticatedTeacher(
        api,
        'teacher@example.com',
        'Test Teacher'
      )

      // Verify user data
      assert.strictEqual(result.user.email, 'teacher@example.com')
      assert.strictEqual(result.user.name, 'Test Teacher')
      assert.strictEqual(result.user.emailVerified, true)

      // Verify session cookie exists
      assert(result.sessionCookie)
      assert(result.sessionCookie.startsWith('better-auth.session_token='))

      // Verify Teacher profile was created through Better Auth hooks
      const teacher = await Teacher.findOne({ userId: result.user.id })
      assert(teacher, 'Teacher profile should be created')
      assert.strictEqual(teacher.email, 'teacher@example.com')
      assert.strictEqual(teacher.name, 'Test Teacher')
      assert.strictEqual(teacher.userId, result.user.id)
      assert(Array.isArray(teacher.students))
      assert.strictEqual(teacher.students.length, 0)
    })

    it('should create authenticated student with valid session and profile', async () => {
      const result = await TestHelper.createAuthenticatedStudent(
        api,
        'student@example.com',
        'Test Student'
      )

      // Verify user data
      assert.strictEqual(result.user.email, 'student@example.com')
      assert.strictEqual(result.user.name, 'Test Student')
      assert.strictEqual(result.user.emailVerified, true)

      // Verify session cookie exists
      assert(result.sessionCookie)
      assert(result.sessionCookie.startsWith('better-auth.session_token='))

      // Verify Student profile was created through Better Auth hooks
      const student = await Student.findOne({ userId: result.user.id })
      assert(student, 'Student profile should be created')
      assert.strictEqual(student.email, 'student@example.com')
      assert.strictEqual(student.name, 'Test Student')
      assert.strictEqual(student.userId, result.user.id)
      assert.strictEqual(student.teacher, null)
    })

    it('should create working session cookies that authenticate with API', async () => {
      const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(api)

      // Test that the session cookie works with a protected endpoint
      const response = await api
        .get('/api/students')
        .set('Cookie', sessionCookie)

      // Should get 200 (teacher can access) instead of 401 (authentication failed)
      assert.strictEqual(response.status, 200)
    })

    it('should make authenticated requests using convenience helper', async () => {
      const { response } = await TestHelper.makeAuthenticatedRequest(
        api,
        'get',
        '/api/students',
        'teacher'
      )

      // Teacher should get 200 for /api/students
      assert.strictEqual(response.status, 200)

      const { response: studentResponse } =
        await TestHelper.makeAuthenticatedRequest(
          api,
          'get',
          '/api/students',
          'student'
        )

      // Student should get 403 for /api/students
      assert.strictEqual(studentResponse.status, 403)
    })
  })
})
