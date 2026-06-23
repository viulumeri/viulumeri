import { describe, it, before, beforeEach, after } from 'node:test'
import assert from 'node:assert'
import fs from 'fs/promises'
import path from 'path'
import supertest from 'supertest'
import type { Response } from 'superagent'
import app from '../app'
import { musicService } from '../services/music'
import { TestHelper } from '../utils/testHelper'

const api = supertest(app)
const testMusicDir = path.join(__dirname, 'tmp', 'admin-songs-integration')
let originalMusicDir: string | undefined

const parseResponseBodyAsBuffer = (
  response: Response,
  callback: (error: Error | null, body?: Buffer) => void
): void => {
  const chunks: Buffer[] = []

  response.on('data', (chunk: Buffer | string) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  })
  response.on('end', () => callback(null, Buffer.concat(chunks)))
  response.on('error', callback)
}

const asUpload = (content: string, name = 'track.mp3') => ({
  data: Buffer.from(content).toString('base64'),
  name,
  type: 'audio/mpeg'
})

const imageUpload = async () => {
  const image = await fs.readFile(
    path.join(__dirname, 'fixtures', 'music', 'valid-song-1', 'images', 'original.jpg')
  )

  return {
    data: image.toString('base64'),
    name: 'cover.jpg',
    type: 'image/jpeg'
  }
}

const createSongPayload = (overrides: Record<string, unknown> = {}) => ({
  name: 'Integration Created Song',
  composer: 'Integration Composer',
  isImpro: false,
  isHidden: false,
  instrumentalTrack: asUpload('regular backing', 'backing.mp3'),
  ...overrides
})

const resetMusicDir = async () => {
  await fs.rm(testMusicDir, { recursive: true, force: true })
  await fs.mkdir(testMusicDir, { recursive: true })
  process.env.MUSIC_DIR = testMusicDir
  await musicService.initialize(testMusicDir)
}

before(async () => {
  originalMusicDir = process.env.MUSIC_DIR
  process.env.MUSIC_DIR = testMusicDir

  await TestHelper.setupTestDatabase()
  await resetMusicDir()
})

beforeEach(async () => {
  await TestHelper.clearDatabase()
  await resetMusicDir()
})

after(async () => {
  process.env.MUSIC_DIR = originalMusicDir
  await fs.rm(testMusicDir, { recursive: true, force: true })
  await TestHelper.cleanup()
})

describe('Admin songs API authorization and validation', () => {
  it('requires an admin session for song management', async () => {
    const unauthenticated = await api.post('/api/admin/songs').send(createSongPayload())

    assert.strictEqual(unauthenticated.status, 401)
    assert.strictEqual(unauthenticated.body.error, 'Authentication required')

    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.admin-songs@edu.hel.fi',
      'Teacher Admin Songs'
    )

    const forbidden = await api
      .post('/api/admin/songs')
      .set('Cookie', sessionCookie)
      .send(createSongPayload())

    assert.strictEqual(forbidden.status, 403)
    assert.strictEqual(forbidden.body.error, 'Admin role required')
  })

  it('returns useful errors for invalid creates and missing songs', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedAdmin(
      api,
      'admin.invalid-songs@edu.hel.fi',
      'Admin Invalid Songs'
    )

    const missingName = await api
      .post('/api/admin/songs')
      .set('Cookie', sessionCookie)
      .send(createSongPayload({ name: '' }))

    assert.strictEqual(missingName.status, 400)
    assert.strictEqual(missingName.body.error, 'Song name must be 1-100 characters')

    const missingInstrumental = await api
      .post('/api/admin/songs')
      .set('Cookie', sessionCookie)
      .send({ name: 'Missing Instrumental' })

    assert.strictEqual(missingInstrumental.status, 400)
    assert.strictEqual(missingInstrumental.body.error, 'Instrumental track is required')

    const missingPatch = await api
      .patch('/api/admin/songs/missing-song')
      .set('Cookie', sessionCookie)
      .send({ name: 'Still Missing' })

    assert.strictEqual(missingPatch.status, 404)
    assert.strictEqual(missingPatch.body.error, 'Song not found')

    const missingDelete = await api
      .delete('/api/admin/songs/missing-song')
      .set('Cookie', sessionCookie)

    assert.strictEqual(missingDelete.status, 404)
    assert.strictEqual(missingDelete.body.error, 'Song not found')
  })
})

describe('Admin songs API create, edit, delete integration', () => {
  it('creates a public song that regular users can list and play', async () => {
    const { sessionCookie: adminCookie } = await TestHelper.createAuthenticatedAdmin(
      api,
      'admin.create-song@edu.hel.fi',
      'Admin Create Song'
    )
    const createResponse = await api
      .post('/api/admin/songs')
      .set('Cookie', adminCookie)
      .send(createSongPayload({
        name: 'Public Admin Song',
        isImpro: true,
        melodyTrack: asUpload('regular melody', 'melody.mp3'),
        slowInstrumentalTrack: asUpload('slow backing', 'backing.mp3'),
        slowMelodyTrack: asUpload('slow melody', 'melody.mp3'),
        image: await imageUpload()
      }))

    assert.strictEqual(createResponse.status, 201)
    const created = createResponse.body.song
    assert.strictEqual(created.title, 'Public Admin Song')
    assert.strictEqual(created.metadata.composer, 'Integration Composer')
    assert.strictEqual(created.isImpro, true)
    assert.strictEqual(created.hasInstrumentalTrack, true)
    assert.strictEqual(created.hasMelodyTrack, true)
    assert.strictEqual(created.hasSlowInstrumentalTrack, true)
    assert.strictEqual(created.hasSlowMelodyTrack, true)
    assert.strictEqual(created.hasImage, true)

    const adminList = await api.get('/api/admin/songs').set('Cookie', adminCookie)
    assert.strictEqual(adminList.status, 200)
    assert(adminList.body.songs.some((song: { id: string }) => song.id === created.id))

    const { sessionCookie: studentCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.created-song@edu.hel.fi',
      'Student Created Song'
    )

    const publicList = await api.get('/api/songs').set('Cookie', studentCookie)
    assert.strictEqual(publicList.status, 200)
    const publicSong = publicList.body.find((song: { id: string }) => song.id === created.id)
    assert(publicSong)
    assert.strictEqual(publicSong.title, 'Public Admin Song')
    assert.strictEqual(publicSong.metadata.isImpro, true)

    const detail = await api.get(`/api/songs/${created.id}`).set('Cookie', studentCookie)
    assert.strictEqual(detail.status, 200)
    assert.strictEqual(detail.body.id, created.id)

    const regularBundle = await api
      .get(`/api/songs/${created.id}/bundle`)
      .set('Cookie', studentCookie)
      .buffer(true)
      .parse(parseResponseBodyAsBuffer)
    assert.strictEqual(regularBundle.status, 200)
    assert(regularBundle.body.length > 0)

    const slowBundle = await api
      .get(`/api/songs/${created.id}/bundle-slow`)
      .set('Cookie', studentCookie)
      .buffer(true)
      .parse(parseResponseBodyAsBuffer)
    assert.strictEqual(slowBundle.status, 200)
    assert(slowBundle.body.length > 0)

    const image = await api
      .get(`/api/songs/${created.id}/image/list`)
      .set('Cookie', studentCookie)

    assert.strictEqual(image.status, 200)
    assert.match(image.headers['content-type'], /image\/webp/)
  })

  it('keeps hidden songs out of the regular list until they are published', async () => {
    const { sessionCookie: adminCookie } = await TestHelper.createAuthenticatedAdmin(
      api,
      'admin.hidden-song@edu.hel.fi',
      'Admin Hidden Song'
    )
    const { sessionCookie: studentCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.hidden-song@edu.hel.fi',
      'Student Hidden Song'
    )

    const createResponse = await api
      .post('/api/admin/songs')
      .set('Cookie', adminCookie)
      .send(createSongPayload({
        name: 'Hidden Admin Song',
        isHidden: true
      }))

    assert.strictEqual(createResponse.status, 201)
    const created = createResponse.body.song
    assert.strictEqual(created.isHidden, true)

    const hiddenList = await api.get('/api/songs').set('Cookie', studentCookie)
    assert.strictEqual(hiddenList.status, 200)
    assert.strictEqual(
      hiddenList.body.some((song: { id: string }) => song.id === created.id),
      false
    )

    const publishResponse = await api
      .patch(`/api/admin/songs/${created.id}`)
      .set('Cookie', adminCookie)
      .send({
        isHidden: false,
        isImpro: true,
        melodyTrack: asUpload('added melody', 'melody.mp3'),
        slowInstrumentalTrack: asUpload('added slow backing', 'backing.mp3')
      })

    assert.strictEqual(publishResponse.status, 200)
    assert.strictEqual(publishResponse.body.song.isHidden, false)
    assert.strictEqual(publishResponse.body.song.isImpro, true)
    assert.strictEqual(publishResponse.body.song.hasMelodyTrack, true)
    assert.strictEqual(publishResponse.body.song.hasSlowInstrumentalTrack, true)

    const publicList = await api.get('/api/songs').set('Cookie', studentCookie)
    assert.strictEqual(publicList.status, 200)
    assert(publicList.body.some((song: { id: string }) => song.id === created.id))

    const removeOptionalTracks = await api
      .patch(`/api/admin/songs/${created.id}`)
      .set('Cookie', adminCookie)
      .send({
        isImpro: true,
        deleteMelodyTrack: true,
        deleteSlowInstrumentalTrack: true
      })

    assert.strictEqual(removeOptionalTracks.status, 200)
    assert.strictEqual(removeOptionalTracks.body.song.hasInstrumentalTrack, true)
    assert.strictEqual(removeOptionalTracks.body.song.hasMelodyTrack, false)
    assert.strictEqual(removeOptionalTracks.body.song.hasSlowInstrumentalTrack, false)

    const missingSlowBundle = await api
      .get(`/api/songs/${created.id}/bundle-slow`)
      .set('Cookie', studentCookie)

    assert.strictEqual(missingSlowBundle.status, 404)
  })

  it('persists admin song order for admin and regular user song lists', async () => {
    const { sessionCookie: adminCookie } = await TestHelper.createAuthenticatedAdmin(
      api,
      'admin.order-songs@edu.hel.fi',
      'Admin Order Songs'
    )
    const { sessionCookie: studentCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.order-songs@edu.hel.fi',
      'Student Order Songs'
    )

    const zetaResponse = await api
      .post('/api/admin/songs')
      .set('Cookie', adminCookie)
      .send(createSongPayload({ name: 'Zeta Order Song' }))
    const alphaResponse = await api
      .post('/api/admin/songs')
      .set('Cookie', adminCookie)
      .send(createSongPayload({ name: 'Alpha Order Song' }))
    const middleResponse = await api
      .post('/api/admin/songs')
      .set('Cookie', adminCookie)
      .send(createSongPayload({ name: 'Middle Order Song' }))

    assert.strictEqual(zetaResponse.status, 201)
    assert.strictEqual(alphaResponse.status, 201)
    assert.strictEqual(middleResponse.status, 201)

    const zeta = zetaResponse.body.song
    const alpha = alphaResponse.body.song
    const middle = middleResponse.body.song

    const defaultAdminList = await api.get('/api/admin/songs').set('Cookie', adminCookie)
    assert.strictEqual(defaultAdminList.status, 200)
    assert.deepStrictEqual(
      defaultAdminList.body.songs.map((song: { id: string }) => song.id),
      [alpha.id, middle.id, zeta.id]
    )

    const invalidOrder = await api
      .patch('/api/admin/songs/order')
      .set('Cookie', adminCookie)
      .send({ songIds: [zeta.id, 'missing-song'] })

    assert.strictEqual(invalidOrder.status, 400)
    assert.strictEqual(invalidOrder.body.error, 'Song order contains unknown songs')

    const customOrder = [zeta.id, alpha.id, middle.id]
    const orderResponse = await api
      .patch('/api/admin/songs/order')
      .set('Cookie', adminCookie)
      .send({ songIds: customOrder })

    assert.strictEqual(orderResponse.status, 200)
    assert.deepStrictEqual(
      orderResponse.body.songs.map((song: { id: string }) => song.id),
      customOrder
    )

    const publicList = await api.get('/api/songs').set('Cookie', studentCookie)
    assert.strictEqual(publicList.status, 200)
    assert.deepStrictEqual(
      publicList.body.map((song: { id: string }) => song.id),
      customOrder
    )
  })

  it('deletes songs from admin and regular user views', async () => {
    const { sessionCookie: adminCookie } = await TestHelper.createAuthenticatedAdmin(
      api,
      'admin.delete-song@edu.hel.fi',
      'Admin Delete Song'
    )
    const { sessionCookie: studentCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.delete-song@edu.hel.fi',
      'Student Delete Song'
    )

    const createResponse = await api
      .post('/api/admin/songs')
      .set('Cookie', adminCookie)
      .send(createSongPayload({ name: 'Song To Delete' }))

    assert.strictEqual(createResponse.status, 201)
    const created = createResponse.body.song

    const deleteResponse = await api
      .delete(`/api/admin/songs/${created.id}`)
      .set('Cookie', adminCookie)

    assert.strictEqual(deleteResponse.status, 204)

    const adminList = await api.get('/api/admin/songs').set('Cookie', adminCookie)
    assert.strictEqual(adminList.status, 200)
    assert.strictEqual(
      adminList.body.songs.some((song: { id: string }) => song.id === created.id),
      false
    )

    const publicList = await api.get('/api/songs').set('Cookie', studentCookie)
    assert.strictEqual(publicList.status, 200)
    assert.strictEqual(
      publicList.body.some((song: { id: string }) => song.id === created.id),
      false
    )

    const detail = await api.get(`/api/songs/${created.id}`).set('Cookie', studentCookie)
    assert.strictEqual(detail.status, 404)
  })
})
