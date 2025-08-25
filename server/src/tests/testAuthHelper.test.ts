import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { TestAuthHelper } from '../utils/testAuthHelper'
import Teacher from '../models/teacher'
import Student from '../models/student'

describe('Auth Integration Tests', () => {
  before(async () => {
    await TestAuthHelper.setupTestDatabase()
  })

  beforeEach(async () => {
    await TestAuthHelper.clearDatabase()
  })

  after(async () => {
    await TestAuthHelper.cleanup()
  })

  describe('User Creation Hook', () => {
    it('should create Teacher profile when Better Auth user is created as teacher', async () => {
      const userData = {
        email: 'teacher@example.com',
        name: 'Test Teacher',
        userType: 'teacher' as const
      }

      const result = await TestAuthHelper.createTestUser(userData)

      // Verify Better Auth user was created
      assert.strictEqual(result.user.email, userData.email)
      assert.strictEqual(result.user.name, userData.name)
      assert.strictEqual(result.user.userType, userData.userType)
      assert.strictEqual(result.user.emailVerified, true)

      // Verify Teacher profile was created
      const teacher = await Teacher.findOne({ userId: result.user.id })
      assert(teacher, 'Teacher profile should be created')
      assert.strictEqual(teacher.email, userData.email)
      assert.strictEqual(teacher.name, userData.name)
      assert.strictEqual(teacher.userId, result.user.id)
      assert(Array.isArray(teacher.students))
      assert.strictEqual(teacher.students.length, 0)
    })

    it('should create Student profile when Better Auth user is created as student', async () => {
      const userData = {
        email: 'student@example.com',
        name: 'Test Student',
        userType: 'student' as const
      }

      const result = await TestAuthHelper.createTestUser(userData)

      // Verify Better Auth user was created
      assert.strictEqual(result.user.email, userData.email)
      assert.strictEqual(result.user.name, userData.name)
      assert.strictEqual(result.user.userType, userData.userType)

      // Verify Student profile was created
      const student = await Student.findOne({ userId: result.user.id })
      assert(student, 'Student profile should be created')
      assert.strictEqual(student.email, userData.email)
      assert.strictEqual(student.name, userData.name)
      assert.strictEqual(student.userId, result.user.id)
      assert.strictEqual(student.teacher, null)
    })

    it('should maintain referential integrity between users and profiles', async () => {
      const teacherData = await TestAuthHelper.createTestUser({
        email: 'teacher@test.com',
        name: 'Teacher',
        userType: 'teacher'
      })

      const studentData = await TestAuthHelper.createTestUser({
        email: 'student@test.com',
        name: 'Student',
        userType: 'student'
      })

      // Link student to teacher
      await Student.updateOne(
        { _id: studentData.profile.id },
        { teacher: teacherData.profile.id }
      )
      await Teacher.updateOne(
        { _id: teacherData.profile.id },
        { $push: { students: studentData.profile.id } }
      )

      // Verify relationship
      const teacher = await Teacher.findById(teacherData.profile.id).populate(
        'students'
      )
      const student = await Student.findById(studentData.profile.id).populate(
        'teacher'
      )

      assert.strictEqual(teacher.students.length, 1)
      assert.strictEqual(
        teacher.students[0].id,
        studentData.profile.id
      )
      assert.strictEqual(
        student.teacher.id,
        teacherData.profile.id
      )
    })
  })

  describe('Session Management', () => {
    it('should create valid session tokens', async () => {
      const userData = await TestAuthHelper.createTestUser({
        email: 'session@test.com',
        name: 'Session User',
        userType: 'teacher'
      })

      const session = await TestAuthHelper.createSession(userData.user.id)

      assert(session.sessionId)
      assert(session.token)
      assert(session.token.startsWith('test-session-'))

      // Verify session was stored in database
      const db = TestAuthHelper.getClient().db()
      const sessionsCollection = db.collection('session')
      const storedSession = await sessionsCollection.findOne({
        id: session.sessionId
      })

      assert(storedSession)
      assert.strictEqual(storedSession.userId, userData.user.id)
      assert.strictEqual(storedSession.token, session.token)
    })

    it('should create session cookie helper', () => {
      const token = 'test-token-123'
      const cookie = TestAuthHelper.getSessionCookie(token)

      assert.strictEqual(cookie, 'better-auth.session_token=test-token-123')
    })
  })
})
