/*
Test Cases to Implement for GET /api/students:

1. No session returns 401 Unauthorized
   - Make request without session cookie
   - Verify 401 status and "Authentication required" error message

2. Student userType returns 403 Forbidden  
   - Create student user with valid session
   - Make authenticated request as student
   - Verify 403 status and "Teacher role required" error message

3. Teacher profile not found returns 404
   - Create Better Auth teacher user but delete Teacher profile (edge case)
   - Make authenticated request as teacher
   - Verify 404 status and "Teacher profile not found" error message

4. Valid teacher request returns 200 with student list
   - Create teacher with linked students
   - Make authenticated request as teacher
   - Verify 200 status and correct response format: { students: [{ id, name }] }
*/

// const response = await api.get(url)
//
import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { TestAuthHelper } from '../utils/testAuthHelper'
// import Teacher from '../models/teacher'
// import Student from '../models/student'
import supertest from 'supertest'
import app from '../app'

const api = supertest(app)

describe('Student API', () => {
  before(async () => {
    await TestAuthHelper.setupTestDatabase()
  })

  beforeEach(async () => {
    await TestAuthHelper.cleanup()
  })
})
