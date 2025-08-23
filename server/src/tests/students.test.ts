import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { TestAuthHelper } from '../utils/testAuthHelper'
import supertest from 'supertest'
import app from '../app'

const api = supertest(app)

describe('Students API GET', () => {
  before(async () => {
    await TestAuthHelper.setupTestDatabase()
  })

  beforeEach(async () => {
    await TestAuthHelper.clearDatabase()
  })

  after(async () => {
    console.log('Cleaning up...')
    await TestAuthHelper.cleanup()
    console.log('Cleanup complete')
  })

  it('should return 401 Unauthorized without session', async () => {
    const response = await api.get('/api/students')

    assert.strictEqual(response.status, 401)
    assert.strictEqual(response.body.error, 'Authentication required')
  })
})
