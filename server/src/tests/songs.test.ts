import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { TestHelper } from '../utils/testHelper'
import supertest from 'supertest'
import app from '../app'
import { musicService } from '../services/music'
import path from 'path'
import fs from 'fs/promises'

const api = supertest(app)
const url = '/api/songs'

const testMusicDir = path.join(__dirname, 'fixtures', 'music')
let originalMusicDir: string | undefined

before(async () => {
  originalMusicDir = process.env.MUSIC_DIR
  process.env.MUSIC_DIR = testMusicDir

  await TestHelper.setupTestDatabase()
  await musicService.initialize(testMusicDir)
})

beforeEach(async () => {
  await TestHelper.clearDatabase()
})

after(async () => {
  process.env.MUSIC_DIR = originalMusicDir
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

    const song1 = response.body.find((s: { id: string }) => s.id === 'valid-song-1')
    const song2 = response.body.find((s: { id: string }) => s.id === 'valid-song-2')

    assert(song1)
    assert.strictEqual(song1.title, 'Tästä se alkaa')
    assert.strictEqual(song1.metadata.composer, 'Laura Lintula')
    assert.strictEqual(song1.metadata.images.list, '/api/songs/valid-song-1/image/list')
    assert.strictEqual(song1.metadata.images.card, '/api/songs/valid-song-1/image/card')
    assert.strictEqual(song1.metadata.images.hero, '/api/songs/valid-song-1/image/hero')
    assert(!('audioBundle' in song1)) // Should not include audioBundle

    assert(song2)
    assert.strictEqual(song2.title, 'Hyppyhiiri')
    assert.strictEqual(song2.metadata.composer, 'Laura Lintula')
    assert.strictEqual(song2.metadata.images.list, '/api/songs/valid-song-2/image/list')
    assert.strictEqual(song2.metadata.images.card, '/api/songs/valid-song-2/image/card')
    assert.strictEqual(song2.metadata.images.hero, '/api/songs/valid-song-2/image/hero')
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

  it('should return 200 and stream the zip file when audio bundle file exists', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.bundle@edu.hel.fi',
      'Teacher Bundle'
    )

    const response = await api
      .get(`${url}/valid-song-1/bundle`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
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

    assert.strictEqual(response.status, 200)
  })
})

describe('Songs API HEAD /:id/bundle-slow', () => {
  it('should return 401 Unauthorized without session', async () => {
    const response = await api.head(`${url}/valid-song-1/bundle-slow`)
    assert.strictEqual(response.status, 401)
  })

  it('should return 404 for non-existent song ID', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.slowhead@edu.hel.fi',
      'Teacher Slow Head'
    )

    const response = await api
      .head(`${url}/non-existent-song/bundle-slow`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
  })

  it('should return 200 for valid-song-1 because audio-slow.zip exists', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.slowhead1@edu.hel.fi',
      'Student Slow Head 1'
    )

    const response = await api
      .head(`${url}/valid-song-1/bundle-slow`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.ok(!response.text, 'HEAD response should not contain a text body')
  })

  it('should return 404 for valid-song-2 because audio-slow.zip is missing', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.slowhead2@edu.hel.fi',
      'Student Slow Head 2'
    )

    const response = await api
      .head(`${url}/valid-song-2/bundle-slow`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
  })
})

describe('Songs API GET /:id/bundle-slow', () => {
  it('should return 401 Unauthorized without session', async () => {
    const response = await api.get(`${url}/valid-song-1/bundle-slow`)

    assert.strictEqual(response.status, 401)
  })

  it('should return 404 for non-existent song ID', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.slowget@edu.hel.fi',
      'Teacher Slow Get'
    )

    const response = await api
      .get(`${url}/non-existent-song/bundle-slow`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
  })

  it('should return 200 and stream the zip file for valid-song-1', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.slowget1@edu.hel.fi',
      'Teacher Slow Get 1'
    )

    const response = await api
      .get(`${url}/valid-song-1/bundle-slow`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
  })

  it('should return 404 for valid-song-2 because slow file is missing', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.slowget2@edu.hel.fi',
      'Teacher Slow Get 2'
    )

    const response = await api
      .get(`${url}/valid-song-2/bundle-slow`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
  })
})

describe('Songs API GET /:id/image/:variant', () => {
  it('should return 401 Unauthorized without session', async () => {
    const response = await api.get(`${url}/valid-song-1/image/list`)

    assert.strictEqual(response.status, 401)
    assert.strictEqual(response.body.error, 'Authentication required')
  })

  it('should return 404 for non-existent song ID', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.image.404@edu.hel.fi',
      'Teacher Image 404'
    )

    const response = await api
      .get(`${url}/non-existent-song/image/list`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Song not found')
  })

  it('should return 400 for invalid variant', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.image.badvariant@edu.hel.fi',
      'Teacher Image Bad Variant'
    )

    const response = await api
      .get(`${url}/valid-song-1/image/thumbnail`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 400)
    assert.strictEqual(response.body.error, 'Invalid image variant')
  })

  it('should return 200 with cache headers and the generated image file for a self-hosted variant', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.image.ok@edu.hel.fi',
      'Student Image OK'
    )
    const expectedImage = await fs.readFile(
      path.join(testMusicDir, 'valid-song-1', 'images', 'list.webp')
    )

    const response = await api
      .get(`${url}/valid-song-1/image/list`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.headers['cache-control'], 'public, max-age=86400')
    assert.match(response.headers['content-type'], /^image\/webp/)
    assert(Buffer.isBuffer(response.body))
    assert.deepStrictEqual(response.body, expectedImage)
  })

  it('should fall back to svg when no generated raster image exists for the variant', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.image.svg@edu.hel.fi',
      'Student Image SVG'
    )

    const response = await api
      .get(`${url}/valid-song-2/image/hero`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.headers['cache-control'], 'public, max-age=86400')
    assert.match(response.headers['content-type'], /^image\/svg\+xml/)
    assert.match(response.text, /Valid Song 2 Hero/)
  })

  it('should keep the songs list usable when hosted image files are missing', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.image.missing@edu.hel.fi',
      'Teacher Image Missing'
    )
    const previousMusicDir = process.env.MUSIC_DIR
    process.env.MUSIC_DIR = path.join(testMusicDir, 'missing-metadata')

    try {
      const response = await api
        .get(url)
        .set('Cookie', sessionCookie)

      assert.strictEqual(response.status, 200)
      assert(Array.isArray(response.body))
      assert.strictEqual(response.body.length, 2)
      assert.strictEqual(
        response.body[0].metadata.images.card,
        `/api/songs/${response.body[0].id}/image/card`
      )
    } finally {
      process.env.MUSIC_DIR = previousMusicDir
    }
  })
})
