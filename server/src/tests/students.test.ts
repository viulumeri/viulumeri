import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { TestHelper } from '../utils/testHelper'
import supertest from 'supertest'
import app from '../app'

const api = supertest(app)
const url = '/api/students'

describe('Students API GET', () => {
  before(async () => {
    await TestHelper.setupTestDatabase()
  })

  beforeEach(async () => {
    await TestHelper.clearDatabase()
  })

  after(async () => {
    await TestHelper.cleanup()
  })

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
})
