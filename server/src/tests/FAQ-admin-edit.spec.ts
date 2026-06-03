import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { TestHelper } from '../utils/testHelper'
import supertest from 'supertest'
import app from '../app'
import { Faq } from '../models/FAQ'


const api = supertest(app)

describe('FAQ endpoints', () => {
  before(async () => {
    await TestHelper.setupTestDatabase()
  })

  beforeEach(async () => {
    await TestHelper.clearDatabase()
  })

  after(async () => {
    await TestHelper.cleanup()
  })

  it('example test', async () => {
    assert.ok(true)
  })


//Admin voi lisätä uuden kysymyksen.
  it('Admin can create FAQ', async () => {
  const admin = await TestHelper.createAuthenticatedAdmin(api)

  const response = await api
    .post('/api/admin/faq')
    .set('Cookie', admin.sessionCookie)
    .send({
      question: 'Testikysymys?',
      answer: 'Testivastaus.'
    })

  assert.strictEqual(response.status, 201)
  assert.strictEqual(response.body.question, 'Testikysymys?')
  assert.strictEqual(response.body.answer, 'Testivastaus.')

  const savedFaq = await Faq.findOne({ question: 'Testikysymys?' })

  assert.ok(savedFaq)
  assert.strictEqual(savedFaq.answer, 'Testivastaus.')
    })


//Admin voi poistaa vanhan kysymyksen.
  it('Admin can delete FAQ', async () => {
  const admin = await TestHelper.createAuthenticatedAdmin(api)

  const created = await api
    .post('/api/admin/faq')
    .set('Cookie', admin.sessionCookie)
    .send({
      question: 'Poistettava kysymys',
      answer: 'Poistettava vastaus'
    })

  const response = await api
    .delete(`/api/admin/faq/${created.body._id}`)
    .set('Cookie', admin.sessionCookie)

  assert.strictEqual(response.status, 204)

  const deletedFaq = await Faq.findById(created.body._id)

  assert.strictEqual(deletedFaq, null)
  })


//Admin voi muuttaa vanhan kysymyksen.
it('Admin can update FAQ', async () => {
  const admin = await TestHelper.createAuthenticatedAdmin(api)

  // luodaan FAQ ensin
  const created = await api
    .post('/api/admin/faq')
    .set('Cookie', admin.sessionCookie)
    .send({
      question: 'Vanha kysymys',
      answer: 'Vanha vastaus'
    })

  const response = await api
    .put(`/api/admin/faq/${created.body._id}`)
    .set('Cookie', admin.sessionCookie)
    .send({
      question: 'Uusi kysymys',
      answer: 'Uusi vastaus'
    })

  assert.strictEqual(response.status, 200)

  assert.strictEqual(
    response.body.question,
    'Uusi kysymys'
  )

  assert.strictEqual(
    response.body.answer,
    'Uusi vastaus'
  )

  const updatedFaq = await Faq.findById(
    created.body._id
  )

  assert.ok(updatedFaq)

  assert.strictEqual(
    updatedFaq?.question,
    'Uusi kysymys'
  )

  assert.strictEqual(
    updatedFaq?.answer,
    'Uusi vastaus'
  )
  })


  // FAQ:t näkyvät FAQ-listauksessa.
  it('Returns saved FAQs', async () => {
  const admin = await TestHelper.createAuthenticatedAdmin(api)

  await api
    .post('/api/admin/faq')
    .set('Cookie', admin.sessionCookie)
    .send({
      question: 'Näkyvä kysymys',
      answer: 'Näkyvä vastaus',
      order: 1
    })

  const response = await api
    .get('/api/faq')
    .set('Cookie', admin.sessionCookie)

  assert.strictEqual(response.status, 200)

  assert.strictEqual(response.body.length, 1)

  assert.strictEqual(
    response.body[0].question,
    'Näkyvä kysymys'
  )

  assert.strictEqual(
    response.body[0].answer,
    'Näkyvä vastaus'
  )
})


// FAQ:t näkyvät oikeassa järjestyksessä FAQ-listauksessa.
it('Returns FAQs in order', async () => {
  const admin = await TestHelper.createAuthenticatedAdmin(api)

  await api
    .post('/api/admin/faq')
    .set('Cookie', admin.sessionCookie)
    .send({
      question: 'Toinen kysymys',
      answer: 'Toinen vastaus',
      order: 2
    })

  await api
    .post('/api/admin/faq')
    .set('Cookie', admin.sessionCookie)
    .send({
      question: 'Ensimmäinen kysymys',
      answer: 'Ensimmäinen vastaus',
      order: 1
    })

  const response = await api
    .get('/api/faq')
    .set('Cookie', admin.sessionCookie)

  assert.strictEqual(response.status, 200)
  assert.strictEqual(response.body[0].question, 'Ensimmäinen kysymys')
  assert.strictEqual(response.body[1].question, 'Toinen kysymys')
  })


  // Adminin poistetut FAQ:t eivät näy FAQ-listauksessa.
  it('Deleted FAQ is not returned', async () => {
  const admin = await TestHelper.createAuthenticatedAdmin(api)

  const created = await api
    .post('/api/admin/faq')
    .set('Cookie', admin.sessionCookie)
    .send({
      question: 'Poistettava kysymys',
      answer: 'Poistettava vastaus',
      order: 1
    })

  await api
    .delete(`/api/admin/faq/${created.body._id}`)
    .set('Cookie', admin.sessionCookie)

  const response = await api
    .get('/api/faq')
    .set('Cookie', admin.sessionCookie)

  assert.strictEqual(response.status, 200)
  assert.strictEqual(response.body.length, 0)
})


// FAQ-listaus palauttaa tyhjän taulukon, jos FAQ:ta ei ole.
it('Returns empty array when there are no FAQs', async () => {
  const admin = await TestHelper.createAuthenticatedAdmin(api)

  const response = await api
    .get('/api/faq')
    .set('Cookie', admin.sessionCookie)

  assert.strictEqual(response.status, 200)
  assert.deepStrictEqual(response.body, [])
})
})