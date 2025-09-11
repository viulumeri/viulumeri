import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { TestHelper } from '../utils/testHelper'
import supertest from 'supertest'
import app from '../app'
import Teacher from '../models/teacher'
import Student from '../models/student'
import Homework from '../models/homework'

const api = supertest(app)
const url = '/api/homework'

before(async () => {
  await TestHelper.setupTestDatabase()
})

beforeEach(async () => {
  await TestHelper.clearDatabase()
})

after(async () => {
  await TestHelper.cleanup()
})

describe('Homework API POST', () => {
  it('should return 401 Unauthorized without session', async () => {
    const response = await api.post(url).send({
      studentId: '507f1f77bcf86cd799439011',
      songs: ['song1'],
      comment: 'Test comment'
    })

    assert.strictEqual(response.status, 401)
    assert.strictEqual(response.body.error, 'Authentication required')
  })

  it('should return 403 Forbidden for a student', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'some.student@edu.hel.fi',
      'Some Student'
    )

    const response = await api
      .post(url)
      .set('Cookie', sessionCookie)
      .send({
        studentId: '507f1f77bcf86cd799439011',
        songs: ['song1'],
        comment: 'Test comment'
      })

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Teacher role required')
  })

  it('should return 400 Bad Request when studentId is missing', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'valid.teacher@edu.hel.fi',
      'Valid Teacher'
    )

    const response = await api
      .post(url)
      .set('Cookie', sessionCookie)
      .send({
        songs: ['song1'],
        comment: 'Test comment'
      })

    assert.strictEqual(response.status, 400)
    assert.strictEqual(response.body.error, 'studentId required')
  })

  it('should return 400 Bad Request when songs is not an array', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'valid.teacher@edu.hel.fi',
      'Valid Teacher'
    )

    const response = await api
      .post(url)
      .set('Cookie', sessionCookie)
      .send({
        studentId: '507f1f77bcf86cd799439011',
        songs: 'not-an-array',
        comment: 'Test comment'
      })

    assert.strictEqual(response.status, 400)
    assert.strictEqual(response.body.error, 'songs must be array')
  })

  it('should return 404 when teacher profile not found', async () => {
    const { user, sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'orphaned.teacher@edu.hel.fi',
      'Orphaned Teacher'
    )

    await Teacher.deleteOne({ userId: user.id })

    const response = await api
      .post(url)
      .set('Cookie', sessionCookie)
      .send({
        studentId: '507f1f77bcf86cd799439011',
        songs: ['song1'],
        comment: 'Test comment'
      })

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Teacher profile not found')
  })

  it('should return 404 when student not found', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.no.student@edu.hel.fi',
      'Teacher No Student'
    )

    const response = await api
      .post(url)
      .set('Cookie', sessionCookie)
      .send({
        studentId: '507f1f77bcf86cd799439011',
        songs: ['song1'],
        comment: 'Test comment'
      })

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Student not found')
  })

  it('should return 403 when student not linked to teacher', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'unlinked.teacher@edu.hel.fi',
      'Unlinked Teacher'
    )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'unlinked.student@edu.hel.fi',
      'Unlinked Student'
    )

    const student = await Student.findOne({ userId: studentUser.id })

    const response = await api
      .post(url)
      .set('Cookie', sessionCookie)
      .send({
        studentId: student!.id,
        songs: ['song1'],
        comment: 'Test comment'
      })

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Student is not linked to this teacher')
  })

  it('should successfully create homework with default values', async () => {
    const { user: teacherUser, sessionCookie } =
      await TestHelper.createAuthenticatedTeacher(
        api,
        'teacher.creating.homework@edu.hel.fi',
        'Teacher Creating Homework'
      )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.receiving.homework@edu.hel.fi',
      'Student Receiving Homework'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    await student!.save()
    teacher!.students.push(student!.id)
    await teacher!.save()

    const response = await api
      .post(url)
      .set('Cookie', sessionCookie)
      .send({
        studentId: student!.id
      })

    assert.strictEqual(response.status, 201)
    assert.strictEqual(response.body.teacher, teacher!.id)
    assert.strictEqual(response.body.student, student!.id)
    assert(Array.isArray(response.body.songs))
    assert.strictEqual(response.body.songs.length, 0)
    assert.strictEqual(response.body.comment, '')
    assert.strictEqual(response.body.practiceCount, 0)
    assert(response.body.id)
    assert(response.body.createdAt)
  })

  it('should successfully create homework with provided values', async () => {
    const { user: teacherUser, sessionCookie } =
      await TestHelper.createAuthenticatedTeacher(
        api,
        'teacher.full.homework@edu.hel.fi',
        'Teacher Full Homework'
      )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.full.homework@edu.hel.fi',
      'Student Full Homework'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    await student!.save()
    teacher!.students.push(student!.id)
    await teacher!.save()

    const testSongs = ['song1', 'song2', 'song3']
    const testComment = 'Remember to practice slowly'

    const response = await api
      .post(url)
      .set('Cookie', sessionCookie)
      .send({
        studentId: student!.id,
        songs: testSongs,
        comment: testComment
      })

    assert.strictEqual(response.status, 201)
    assert.strictEqual(response.body.teacher, teacher!.id)
    assert.strictEqual(response.body.student, student!.id)
    assert(Array.isArray(response.body.songs))
    assert.strictEqual(response.body.songs.length, 3)
    assert(response.body.songs.includes('song1'))
    assert(response.body.songs.includes('song2'))
    assert(response.body.songs.includes('song3'))
    assert.strictEqual(response.body.comment, testComment)
    assert.strictEqual(response.body.practiceCount, 0)
    assert(response.body.id)
    assert(response.body.createdAt)

    // Verify homework was actually created in database
    const createdHomework = await Homework.findById(response.body.id)
    assert(createdHomework)
    assert.strictEqual(createdHomework!.teacher.toString(), teacher!.id)
    assert.strictEqual(createdHomework!.student.toString(), student!.id)
    assert.deepStrictEqual(createdHomework!.songs, testSongs)
    assert.strictEqual(createdHomework!.comment, testComment)
  })
})

describe('Homework API GET', () => {
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

  it('should return 200 with empty homework array for student with no homework', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.no.homework@edu.hel.fi',
      'Student No Homework'
    )

    const response = await api.get(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert(Array.isArray(response.body.homework))
    assert.strictEqual(response.body.homework.length, 0)
  })

  it('should return 200 with homework array for student with homework', async () => {
    const { user: teacherUser } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.with.homework@edu.hel.fi',
      'Teacher With Homework'
    )

    const { user: studentUser, sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.with.homework@edu.hel.fi',
      'Student With Homework'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    await student!.save()
    teacher!.students.push(student!.id)
    await teacher!.save()

    // Create homework records
    const homework1 = await Homework.create({
      teacher: teacher!.id,
      student: student!.id,
      songs: ['song1', 'song2'],
      comment: 'First homework',
      practiceCount: 0
    })

    const homework2 = await Homework.create({
      teacher: teacher!.id,
      student: student!.id,
      songs: ['song3'],
      comment: 'Second homework',
      practiceCount: 2
    })

    const response = await api.get(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert(Array.isArray(response.body.homework))
    assert.strictEqual(response.body.homework.length, 2)

    // Check that homework is sorted by createdAt desc (newest first)
    const homeworkList = response.body.homework
    assert.strictEqual(homeworkList[0].id, homework2.id)
    assert.strictEqual(homeworkList[0].comment, 'Second homework')
    assert.strictEqual(homeworkList[0].practiceCount, 2)
    assert(Array.isArray(homeworkList[0].songs))
    assert.strictEqual(homeworkList[0].songs.length, 1)
    assert(homeworkList[0].songs.includes('song3'))

    assert.strictEqual(homeworkList[1].id, homework1.id)
    assert.strictEqual(homeworkList[1].comment, 'First homework')
    assert.strictEqual(homeworkList[1].practiceCount, 0)
    assert(Array.isArray(homeworkList[1].songs))
    assert.strictEqual(homeworkList[1].songs.length, 2)
    assert(homeworkList[1].songs.includes('song1'))
    assert(homeworkList[1].songs.includes('song2'))
  })

  it('should only return homework for the requesting student', async () => {
    const { user: teacherUser } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.multiple.students@edu.hel.fi',
      'Teacher Multiple Students'
    )

    const { user: student1User, sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student1.with.homework@edu.hel.fi',
      'Student One With Homework'
    )

    const { user: student2User } = await TestHelper.createAuthenticatedStudent(
      api,
      'student2.with.homework@edu.hel.fi',
      'Student Two With Homework'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student1 = await Student.findOne({ userId: student1User.id })
    const student2 = await Student.findOne({ userId: student2User.id })

    // Link both students to teacher
    student1!.teacher = teacher!.id
    student2!.teacher = teacher!.id
    await student1!.save()
    await student2!.save()
    teacher!.students.push(student1!.id, student2!.id)
    await teacher!.save()

    // Create homework for both students
    await Homework.create({
      teacher: teacher!.id,
      student: student1!.id,
      songs: ['student1-song'],
      comment: 'Student 1 homework'
    })

    await Homework.create({
      teacher: teacher!.id,
      student: student2!.id,
      songs: ['student2-song'],
      comment: 'Student 2 homework'
    })

    // Student 1 should only see their own homework
    const response = await api.get(url).set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert(Array.isArray(response.body.homework))
    assert.strictEqual(response.body.homework.length, 1)
    assert.strictEqual(response.body.homework[0].comment, 'Student 1 homework')
    assert(response.body.homework[0].songs.includes('student1-song'))
    assert(!response.body.homework[0].songs.includes('student2-song'))
  })
})

describe('Homework API PUT /:homeworkId', () => {
  it('should return 401 Unauthorized without session', async () => {
    const response = await api.put(`${url}/507f1f77bcf86cd799439011`).send({
      songs: ['updated-song'],
      comment: 'Updated comment'
    })

    assert.strictEqual(response.status, 401)
    assert.strictEqual(response.body.error, 'Authentication required')
  })

  it('should return 403 Forbidden for a student', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'some.student@edu.hel.fi',
      'Some Student'
    )

    const response = await api
      .put(`${url}/507f1f77bcf86cd799439011`)
      .set('Cookie', sessionCookie)
      .send({
        songs: ['updated-song'],
        comment: 'Updated comment'
      })

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Teacher role required')
  })

  it('should return 400 Bad Request when songs is not an array', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'valid.teacher@edu.hel.fi',
      'Valid Teacher'
    )

    const response = await api
      .put(`${url}/507f1f77bcf86cd799439011`)
      .set('Cookie', sessionCookie)
      .send({
        songs: 'not-an-array',
        comment: 'Updated comment'
      })

    assert.strictEqual(response.status, 400)
    assert.strictEqual(response.body.error, 'songs must be array')
  })

  it('should return 404 when teacher profile not found', async () => {
    const { user, sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'orphaned.teacher@edu.hel.fi',
      'Orphaned Teacher'
    )

    await Teacher.deleteOne({ userId: user.id })

    const response = await api
      .put(`${url}/507f1f77bcf86cd799439011`)
      .set('Cookie', sessionCookie)
      .send({
        songs: ['updated-song'],
        comment: 'Updated comment'
      })

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Teacher profile not found')
  })

  it('should return 404 when homework not found', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.no.homework@edu.hel.fi',
      'Teacher No Homework'
    )

    const response = await api
      .put(`${url}/507f1f77bcf86cd799439011`)
      .set('Cookie', sessionCookie)
      .send({
        songs: ['updated-song'],
        comment: 'Updated comment'
      })

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Homework not found')
  })

  it('should return 403 when homework does not belong to teacher', async () => {
    const { user: teacher1User } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher1@edu.hel.fi',
      'Teacher One'
    )

    const { user: teacher2User, sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher2@edu.hel.fi',
      'Teacher Two'
    )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.with.homework@edu.hel.fi',
      'Student With Homework'
    )

    const teacher1 = await Teacher.findOne({ userId: teacher1User.id })
    const teacher2 = await Teacher.findOne({ userId: teacher2User.id })
    const student = await Student.findOne({ userId: studentUser.id })

    // Link student to teacher1
    student!.teacher = teacher1!.id
    await student!.save()
    teacher1!.students.push(student!.id)
    await teacher1!.save()

    // Create homework by teacher1
    const homework = await Homework.create({
      teacher: teacher1!.id,
      student: student!.id,
      songs: ['original-song'],
      comment: 'Original comment'
    })

    // Try to update with teacher2's session (should fail)
    const response = await api
      .put(`${url}/${homework.id}`)
      .set('Cookie', sessionCookie)
      .send({
        songs: ['updated-song'],
        comment: 'Updated comment'
      })

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Homework does not belong to this teacher')
  })

  it('should successfully update homework songs only', async () => {
    const { user: teacherUser, sessionCookie } =
      await TestHelper.createAuthenticatedTeacher(
        api,
        'teacher.updating.homework@edu.hel.fi',
        'Teacher Updating Homework'
      )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.homework.update@edu.hel.fi',
      'Student Homework Update'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    await student!.save()
    teacher!.students.push(student!.id)
    await teacher!.save()

    const homework = await Homework.create({
      teacher: teacher!.id,
      student: student!.id,
      songs: ['original-song1', 'original-song2'],
      comment: 'Original comment',
      practiceCount: 3
    })

    const response = await api
      .put(`${url}/${homework.id}`)
      .set('Cookie', sessionCookie)
      .send({
        songs: ['updated-song1', 'updated-song2', 'new-song3']
      })

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.id, homework.id)
    assert.strictEqual(response.body.teacher, teacher!.id)
    assert.strictEqual(response.body.student, student!.id)
    assert(Array.isArray(response.body.songs))
    assert.strictEqual(response.body.songs.length, 3)
    assert(response.body.songs.includes('updated-song1'))
    assert(response.body.songs.includes('updated-song2'))
    assert(response.body.songs.includes('new-song3'))
    assert(!response.body.songs.includes('original-song1'))
    assert(!response.body.songs.includes('original-song2'))
    // Comment should remain unchanged
    assert.strictEqual(response.body.comment, 'Original comment')
    // Practice count should remain unchanged
    assert.strictEqual(response.body.practiceCount, 3)
  })

  it('should successfully update homework comment only', async () => {
    const { user: teacherUser, sessionCookie } =
      await TestHelper.createAuthenticatedTeacher(
        api,
        'teacher.updating.comment@edu.hel.fi',
        'Teacher Updating Comment'
      )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.comment.update@edu.hel.fi',
      'Student Comment Update'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    await student!.save()
    teacher!.students.push(student!.id)
    await teacher!.save()

    const homework = await Homework.create({
      teacher: teacher!.id,
      student: student!.id,
      songs: ['song1', 'song2'],
      comment: 'Original comment',
      practiceCount: 2
    })

    const response = await api
      .put(`${url}/${homework.id}`)
      .set('Cookie', sessionCookie)
      .send({
        comment: 'Updated comment with new instructions'
      })

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.id, homework.id)
    assert.strictEqual(response.body.comment, 'Updated comment with new instructions')
    // Songs should remain unchanged
    assert(Array.isArray(response.body.songs))
    assert.strictEqual(response.body.songs.length, 2)
    assert(response.body.songs.includes('song1'))
    assert(response.body.songs.includes('song2'))
    // Practice count should remain unchanged
    assert.strictEqual(response.body.practiceCount, 2)
  })

  it('should successfully update both songs and comment', async () => {
    const { user: teacherUser, sessionCookie } =
      await TestHelper.createAuthenticatedTeacher(
        api,
        'teacher.full.update@edu.hel.fi',
        'Teacher Full Update'
      )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.full.update@edu.hel.fi',
      'Student Full Update'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    await student!.save()
    teacher!.students.push(student!.id)
    await teacher!.save()

    const homework = await Homework.create({
      teacher: teacher!.id,
      student: student!.id,
      songs: ['old-song'],
      comment: 'Old comment',
      practiceCount: 1
    })

    const response = await api
      .put(`${url}/${homework.id}`)
      .set('Cookie', sessionCookie)
      .send({
        songs: ['new-song1', 'new-song2'],
        comment: 'Completely updated homework instructions'
      })

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.id, homework.id)
    assert.strictEqual(response.body.comment, 'Completely updated homework instructions')
    assert(Array.isArray(response.body.songs))
    assert.strictEqual(response.body.songs.length, 2)
    assert(response.body.songs.includes('new-song1'))
    assert(response.body.songs.includes('new-song2'))
    assert(!response.body.songs.includes('old-song'))
    // Practice count should remain unchanged
    assert.strictEqual(response.body.practiceCount, 1)

    // Verify database was updated
    const updatedHomework = await Homework.findById(homework.id)
    assert(updatedHomework)
    assert.strictEqual(updatedHomework!.comment, 'Completely updated homework instructions')
    assert.deepStrictEqual(updatedHomework!.songs, ['new-song1', 'new-song2'])
    assert.strictEqual(updatedHomework!.practiceCount, 1)
  })
})

describe('Homework API DELETE /:homeworkId', () => {
  it('should return 401 Unauthorized without session', async () => {
    const response = await api.delete(`${url}/507f1f77bcf86cd799439011`)

    assert.strictEqual(response.status, 401)
    assert.strictEqual(response.body.error, 'Authentication required')
  })

  it('should return 403 Forbidden for a student', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'some.student@edu.hel.fi',
      'Some Student'
    )

    const response = await api
      .delete(`${url}/507f1f77bcf86cd799439011`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Teacher role required')
  })

  it('should return 404 when teacher profile not found', async () => {
    const { user, sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'orphaned.teacher@edu.hel.fi',
      'Orphaned Teacher'
    )

    await Teacher.deleteOne({ userId: user.id })

    const response = await api
      .delete(`${url}/507f1f77bcf86cd799439011`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Teacher profile not found')
  })

  it('should return 404 when homework not found', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.no.homework@edu.hel.fi',
      'Teacher No Homework'
    )

    const response = await api
      .delete(`${url}/507f1f77bcf86cd799439011`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Homework not found')
  })

  it('should return 403 when homework does not belong to teacher', async () => {
    const { user: teacher1User } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher1.delete@edu.hel.fi',
      'Teacher One Delete'
    )

    const { user: teacher2User, sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher2.delete@edu.hel.fi',
      'Teacher Two Delete'
    )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.delete.homework@edu.hel.fi',
      'Student Delete Homework'
    )

    const teacher1 = await Teacher.findOne({ userId: teacher1User.id })
    const teacher2 = await Teacher.findOne({ userId: teacher2User.id })
    const student = await Student.findOne({ userId: studentUser.id })

    // Link student to teacher1
    student!.teacher = teacher1!.id
    await student!.save()
    teacher1!.students.push(student!.id)
    await teacher1!.save()

    // Create homework by teacher1
    const homework = await Homework.create({
      teacher: teacher1!.id,
      student: student!.id,
      songs: ['song-to-delete'],
      comment: 'Homework to delete'
    })

    // Try to delete with teacher2's session (should fail)
    const response = await api
      .delete(`${url}/${homework.id}`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Homework does not belong to this teacher')

    // Verify homework still exists
    const existingHomework = await Homework.findById(homework.id)
    assert(existingHomework)
  })

  it('should successfully delete homework', async () => {
    const { user: teacherUser, sessionCookie } =
      await TestHelper.createAuthenticatedTeacher(
        api,
        'teacher.deleting.homework@edu.hel.fi',
        'Teacher Deleting Homework'
      )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.homework.deleted@edu.hel.fi',
      'Student Homework Deleted'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    await student!.save()
    teacher!.students.push(student!.id)
    await teacher!.save()

    const homework = await Homework.create({
      teacher: teacher!.id,
      student: student!.id,
      songs: ['song-to-delete1', 'song-to-delete2'],
      comment: 'This homework will be deleted',
      practiceCount: 5
    })

    // Verify homework exists before deletion
    const homeworkBeforeDelete = await Homework.findById(homework.id)
    assert(homeworkBeforeDelete)

    const response = await api
      .delete(`${url}/${homework.id}`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 204)
    assert.strictEqual(response.text, '')

    // Verify homework was actually deleted from database
    const homeworkAfterDelete = await Homework.findById(homework.id)
    assert.strictEqual(homeworkAfterDelete, null)
  })

  it('should successfully delete one homework without affecting others', async () => {
    const { user: teacherUser, sessionCookie } =
      await TestHelper.createAuthenticatedTeacher(
        api,
        'teacher.selective.delete@edu.hel.fi',
        'Teacher Selective Delete'
      )

    const { user: studentUser } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.selective.delete@edu.hel.fi',
      'Student Selective Delete'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    await student!.save()
    teacher!.students.push(student!.id)
    await teacher!.save()

    // Create multiple homework assignments
    const homework1 = await Homework.create({
      teacher: teacher!.id,
      student: student!.id,
      songs: ['keep-song1'],
      comment: 'Keep this homework'
    })

    const homework2 = await Homework.create({
      teacher: teacher!.id,
      student: student!.id,
      songs: ['delete-song1'],
      comment: 'Delete this homework'
    })

    const homework3 = await Homework.create({
      teacher: teacher!.id,
      student: student!.id,
      songs: ['keep-song2'],
      comment: 'Keep this homework too'
    })

    // Delete only homework2
    const response = await api
      .delete(`${url}/${homework2.id}`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 204)
    assert.strictEqual(response.text, '')

    // Verify homework2 was deleted
    const deletedHomework = await Homework.findById(homework2.id)
    assert.strictEqual(deletedHomework, null)

    // Verify homework1 and homework3 still exist
    const existingHomework1 = await Homework.findById(homework1.id)
    const existingHomework3 = await Homework.findById(homework3.id)
    assert(existingHomework1)
    assert(existingHomework3)
    assert.strictEqual(existingHomework1!.comment, 'Keep this homework')
    assert.strictEqual(existingHomework3!.comment, 'Keep this homework too')
  })
})

describe('Homework API POST /practice/:homeworkId', () => {
  const practiceUrl = `${url}/practice`

  it('should return 401 Unauthorized without session', async () => {
    const response = await api.post(`${practiceUrl}/507f1f77bcf86cd799439011`)

    assert.strictEqual(response.status, 401)
    assert.strictEqual(response.body.error, 'Authentication required')
  })

  it('should return 403 Forbidden for a teacher', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedTeacher(
      api,
      'some.teacher@edu.hel.fi',
      'Some Teacher'
    )

    const response = await api
      .post(`${practiceUrl}/507f1f77bcf86cd799439011`)
      .set('Cookie', sessionCookie)

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

    const response = await api
      .post(`${practiceUrl}/507f1f77bcf86cd799439011`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Student profile not found')
  })

  it('should return 404 when homework not found', async () => {
    const { sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.no.homework@edu.hel.fi',
      'Student No Homework'
    )

    const response = await api
      .post(`${practiceUrl}/507f1f77bcf86cd799439011`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 404)
    assert.strictEqual(response.body.error, 'Homework not found')
  })

  it('should return 403 when homework does not belong to student', async () => {
    const { user: teacherUser } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.practice.test@edu.hel.fi',
      'Teacher Practice Test'
    )

    const { user: student1User } = await TestHelper.createAuthenticatedStudent(
      api,
      'student1.practice@edu.hel.fi',
      'Student One Practice'
    )

    const { user: student2User, sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student2.practice@edu.hel.fi',
      'Student Two Practice'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student1 = await Student.findOne({ userId: student1User.id })
    const student2 = await Student.findOne({ userId: student2User.id })

    // Link both students to teacher
    student1!.teacher = teacher!.id
    student2!.teacher = teacher!.id
    await student1!.save()
    await student2!.save()
    teacher!.students.push(student1!.id, student2!.id)
    await teacher!.save()

    // Create homework for student1
    const homework = await Homework.create({
      teacher: teacher!.id,
      student: student1!.id,
      songs: ['practice-song'],
      comment: 'Practice this song'
    })

    // Try to record practice with student2's session (should fail)
    const response = await api
      .post(`${practiceUrl}/${homework.id}`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 403)
    assert.strictEqual(response.body.error, 'Homework does not belong to this student')
  })

  it('should successfully record practice session for homework with zero practice count', async () => {
    const { user: teacherUser } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.first.practice@edu.hel.fi',
      'Teacher First Practice'
    )

    const { user: studentUser, sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.first.practice@edu.hel.fi',
      'Student First Practice'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    await student!.save()
    teacher!.students.push(student!.id)
    await teacher!.save()

    const homework = await Homework.create({
      teacher: teacher!.id,
      student: student!.id,
      songs: ['first-practice-song'],
      comment: 'First practice session',
      practiceCount: 0
    })

    const response = await api
      .post(`${practiceUrl}/${homework.id}`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.id, homework.id)
    assert.strictEqual(response.body.teacher, teacher!.id)
    assert.strictEqual(response.body.student, student!.id)
    assert.strictEqual(response.body.practiceCount, 1)
    assert.strictEqual(response.body.comment, 'First practice session')
    assert(Array.isArray(response.body.songs))
    assert(response.body.songs.includes('first-practice-song'))

    // Verify database was updated
    const updatedHomework = await Homework.findById(homework.id)
    assert(updatedHomework)
    assert.strictEqual(updatedHomework!.practiceCount, 1)
  })

  it('should successfully increment existing practice count', async () => {
    const { user: teacherUser } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.increment.practice@edu.hel.fi',
      'Teacher Increment Practice'
    )

    const { user: studentUser, sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.increment.practice@edu.hel.fi',
      'Student Increment Practice'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    await student!.save()
    teacher!.students.push(student!.id)
    await teacher!.save()

    const homework = await Homework.create({
      teacher: teacher!.id,
      student: student!.id,
      songs: ['increment-song'],
      comment: 'Keep practicing',
      practiceCount: 5
    })

    const response = await api
      .post(`${practiceUrl}/${homework.id}`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.id, homework.id)
    assert.strictEqual(response.body.practiceCount, 6)
    assert.strictEqual(response.body.comment, 'Keep practicing')

    // Verify database was updated
    const updatedHomework = await Homework.findById(homework.id)
    assert(updatedHomework)
    assert.strictEqual(updatedHomework!.practiceCount, 6)
  })

  it('should handle homework with undefined practice count', async () => {
    const { user: teacherUser } = await TestHelper.createAuthenticatedTeacher(
      api,
      'teacher.undefined.practice@edu.hel.fi',
      'Teacher Undefined Practice'
    )

    const { user: studentUser, sessionCookie } = await TestHelper.createAuthenticatedStudent(
      api,
      'student.undefined.practice@edu.hel.fi',
      'Student Undefined Practice'
    )

    const teacher = await Teacher.findOne({ userId: teacherUser.id })
    const student = await Student.findOne({ userId: studentUser.id })

    student!.teacher = teacher!.id
    await student!.save()
    teacher!.students.push(student!.id)
    await teacher!.save()

    // Create homework without explicit practiceCount (should be undefined/0)
    const homework = await Homework.create({
      teacher: teacher!.id,
      student: student!.id,
      songs: ['undefined-practice-song'],
      comment: 'Handle undefined practice count'
    })

    // Verify initial state
    const initialHomework = await Homework.findById(homework.id)
    assert(initialHomework!.practiceCount === undefined || initialHomework!.practiceCount === 0)

    const response = await api
      .post(`${practiceUrl}/${homework.id}`)
      .set('Cookie', sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.practiceCount, 1)

    // Verify database was updated
    const updatedHomework = await Homework.findById(homework.id)
    assert(updatedHomework)
    assert.strictEqual(updatedHomework!.practiceCount, 1)
  })
})