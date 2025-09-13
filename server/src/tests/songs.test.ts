import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { TestHelper } from '../utils/testHelper'
import supertest from 'supertest'
import app from '../app'
import { musicService } from '../services/music'
import path from 'path'

const api = supertest(app)
const url = '/api/songs'

const testMusicDir = path.join(__dirname, 'fixtures', 'music')

before(async () => {
  await TestHelper.setupTestDatabase()
  await musicService.initialize(testMusicDir)
})

beforeEach(async () => {
  await TestHelper.clearDatabase()
})

after(async () => {
  await TestHelper.cleanup()
})

describe('Songs API GET /', () => {
  it('should return 401 Unauthorized without session', async () => {
    const response = await api.get(url)

    assert.strictEqual(response.status, 401)
    assert.strictEqual(response.body.error, 'Authentication required')
  })

  it('should return 200 with songs list for authenticated teacher', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.songs@edu.hel.fi',
      'Teacher Songs'
    )

    const response = await api.get(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert(Array.isArray(response.body))
    assert.strictEqual(response.body.length, 2)

    const song1 = response.body.find((s: any) => s.id === 'valid-song-1')
    const song2 = response.body.find((s: any) => s.id === 'valid-song-2')

    assert(song1)
    assert.strictEqual(song1.title, 'Tästä se alkaa')
    assert.strictEqual(song1.metadata.composer, 'Laura Lintula')
    assert(!('audioBundle' in song1)) // Should not include audioBundle

    assert(song2)
    assert.strictEqual(song2.title, 'Hyppyhiiri')
    assert.strictEqual(song2.metadata.composer, 'Laura Lintula')
    assert(!('audioBundle' in song2)) // Should not include audioBundle
  })

  it('should return 200 with songs list for authenticated student', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.songs@edu.hel.fi',
      'Student Songs'
    )

    const response = await api.get(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert(Array.isArray(response.body))
    assert.strictEqual(response.body.length, 2)
  })
})

describe('Songs API GET /:id', () => {
  it('should return 401 Unauthorized without session', async () => {
    const response = await api.get(`${url}/valid-song-1`)

    assert.strictEqual(response.status, 401)
    assert.strictEqual(response.body.error, 'Authentication required')
  })

  it('should return 404 for non-existent song ID', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.song.detail@edu.hel.fi',
      'Teacher Song Detail'
    )

    const response = await api
      .get(`${url}/non-existent-song`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Song not found')
  })

  it('should return 200 with song details including audioBundle for valid ID', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.song.detail@edu.hel.fi',
      'Teacher Song Detail'
    )

    const response = await api
      .get(`${url}/valid-song-1`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.id, 'valid-song-1')
    assert.strictEqual(response.body.title, 'Tästä se alkaa')
    assert.strictEqual(response.body.audioBundle, 'audio.zip')
    assert(response.body.metadata)
    assert.strictEqual(response.body.metadata.composer, 'Laura Lintula')
  })

  it('should return 200 with song details for authenticated student', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.song.detail@edu.hel.fi',
      'Student Song Detail'
    )

    const response = await api
      .get(`${url}/valid-song-2`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.id, 'valid-song-2')
    assert.strictEqual(response.body.title, 'Hyppyhiiri')
    assert.strictEqual(response.body.audioBundle, 'audio.zip')
  })
})

describe('Songs API GET /:id/bundle', () => {
  it('should return 401 Unauthorized without session', async () => {
    const response = await api.get(`${url}/valid-song-1/bundle`)

    assert.strictEqual(response.status, 401)
    assert.strictEqual(response.body.error, 'Authentication required')
  })

  it('should return 404 for non-existent song ID', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.bundle@edu.hel.fi',
      'Teacher Bundle'
    )

    const response = await api
      .get(`${url}/non-existent-song/bundle`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Song not found')
  })

  it('should return 404 when audio bundle file does not exist', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.bundle@edu.hel.fi',
      'Teacher Bundle'
    )

    const response = await api
      .get(`${url}/valid-song-1/bundle`)
      .set('Cookie', sessionCookie)

    // In test environment, the mock zip files don't exist on the filesystem
    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Audio bundle not found')
  })

  it('should handle bundle request for authenticated student', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.bundle@edu.hel.fi',
      'Student Bundle'
    )

    const response = await api
      .get(`${url}/valid-song-2/bundle`)
      .set('Cookie', sessionCookie)

    // Same expectation - file doesn't exist in test environment
    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Audio bundle not found')
  })
})
