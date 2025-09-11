import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { TestHelper } from '../utils/testHelper'
import supertest from 'supertest'
import app from '../app'
import Student from '../models/student'

const api = supertest(app)
const url = '/api/played-songs'

before(async () => {
  await TestHelper.setupTestDatabase()
})

beforeEach(async () => {
  await TestHelper.clearDatabase()
})

after(async () => {
  await TestHelper.cleanup()
})

describe('Played Songs API GET', () => {
  it('should return 401 Unauthorized without session', async () => {
    const response = await api.get(url)

    assert.strictEqual(response.status, 401)
    assert.strictEqual(response.body.error, 'Authentication required')
  })

  it('should return 403 Forbidden for a teacher', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'some.teacher@edu.hel.fi',
      'Some Teacher'
    )

    const response = await api.get(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Student role required')
  })

  it('should return 404 when student profile not found', async () => {
    const { user, sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'orphaned.student@edu.hel.fi',
      'Orphaned Student'
    )

    await Student.deleteOne({ userId: user.id })

    const response = await api.get(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Student profile not found')
  })

  it('should return 200 with empty played songs array for new student', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'new.student@edu.hel.fi',
      'New Student'
    )

    const response = await api.get(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert(Array.isArray(response.body.playedSongs))
    assert.strictEqual(response.body.playedSongs.length, 0)
  })

  it('should return 200 with played songs array for student with songs', async () => {
    const { user: studentUser, sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.with.songs@edu.hel.fi',
      'Student With Songs'
    )

    // Add some played songs to the student
    const student = await Student.findOne({ userId: studentUser.id })
    student!.playedSongs = ['song1', 'song2', 'song3']
    await student!.save()

    const response = await api.get(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert(Array.isArray(response.body.playedSongs))
    assert.strictEqual(response.body.playedSongs.length, 3)
    assert(response.body.playedSongs.includes('song1'))
    assert(response.body.playedSongs.includes('song2'))
    assert(response.body.playedSongs.includes('song3'))
  })

  it('should return only the requesting student\'s played songs', async () => {
    // Create first student with songs
    const { user: student1User, sessionCookie: student1Cookie } = 
      await TestHelper.createAuthenticatedStudent(
        api,
        'student1@edu.hel.fi',
        'Student One'
      )

    const student1 = await Student.findOne({ userId: student1User.id })
    student1!.playedSongs = ['song1', 'song2']
    await student1!.save()

    // Create second student with different songs
    const { user: student2User } = await TestHelper.createAuthenticatedStudent(
      api,
      'student2@edu.hel.fi',
      'Student Two'
    )

    const student2 = await Student.findOne({ userId: student2User.id })
    student2!.playedSongs = ['song3', 'song4', 'song5']
    await student2!.save()

    // Request should only return first student's songs
    const response = await api.get(url).set('Cookie', student1Cookie)

    assert.strictEqual(response.status, 200)
    assert(Array.isArray(response.body.playedSongs))
    assert.strictEqual(response.body.playedSongs.length, 2)
    assert(response.body.playedSongs.includes('song1'))
    assert(response.body.playedSongs.includes('song2'))
    assert(!response.body.playedSongs.includes('song3'))
    assert(!response.body.playedSongs.includes('song4'))
    assert(!response.body.playedSongs.includes('song5'))
  })
})