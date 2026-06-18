import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { TestHelper } from '../utils/testHelper'
import supertest from 'supertest'
import app from '../app'
import { Faq } from '../models/FAQ'

const api = supertest(app)

const textBlock = (content: string, order = 0) => ({
  type: 'text',
  content,
  order
})

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

  it('Admin can create FAQ', async () => {
    const admin = await TestHelper.createAuthenticatedAdmin(api)

    const response = await api
      .post('/api/admin/faq')
      .set('Cookie', admin.sessionCookie)
      .send({
        question: 'Testikysymys?',
        blocks: [textBlock('Testivastaus.')]
      })

    assert.strictEqual(response.status, 201)
    assert.strictEqual(response.body.question, 'Testikysymys?')
    assert.strictEqual(response.body.blocks[0].content, 'Testivastaus.')

    const savedFaq = await Faq.findOne({ question: 'Testikysymys?' })

    assert.ok(savedFaq)
    assert.strictEqual(savedFaq.blocks[0].content, 'Testivastaus.')
  })

  it('Admin can delete FAQ', async () => {
    const admin = await TestHelper.createAuthenticatedAdmin(api)

    const created = await api
      .post('/api/admin/faq')
      .set('Cookie', admin.sessionCookie)
      .send({
        question: 'Poistettava kysymys',
        blocks: [textBlock('Poistettava vastaus')]
      })

    const response = await api
      .delete(`/api/admin/faq/${created.body._id}`)
      .set('Cookie', admin.sessionCookie)

    assert.strictEqual(response.status, 204)

    const deletedFaq = await Faq.findById(created.body._id)
    assert.strictEqual(deletedFaq, null)
  })

  it('Admin can update FAQ', async () => {
    const admin = await TestHelper.createAuthenticatedAdmin(api)

    const created = await api
      .post('/api/admin/faq')
      .set('Cookie', admin.sessionCookie)
      .send({
        question: 'Vanha kysymys',
        blocks: [textBlock('Vanha vastaus')]
      })

    const response = await api
      .put(`/api/admin/faq/${created.body._id}`)
      .set('Cookie', admin.sessionCookie)
      .send({
        question: 'Uusi kysymys',
        blocks: [textBlock('Uusi vastaus')]
      })

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.question, 'Uusi kysymys')
    assert.strictEqual(response.body.blocks[0].content, 'Uusi vastaus')

    const updatedFaq = await Faq.findById(created.body._id)

    assert.ok(updatedFaq)
    assert.strictEqual(updatedFaq.question, 'Uusi kysymys')
    assert.strictEqual(updatedFaq.blocks[0].content, 'Uusi vastaus')
  })

  it('Returns saved FAQs', async () => {
    const admin = await TestHelper.createAuthenticatedAdmin(api)

    await api
      .post('/api/admin/faq')
      .set('Cookie', admin.sessionCookie)
      .send({
        question: 'Näkyvä kysymys',
        blocks: [textBlock('Näkyvä vastaus')],
        order: 1
      })

    const response = await api
      .get('/api/faq')
      .set('Cookie', admin.sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.length, 1)
    assert.strictEqual(response.body[0].question, 'Näkyvä kysymys')
    assert.strictEqual(response.body[0].blocks[0].content, 'Näkyvä vastaus')
  })

  it('Returns FAQs in order', async () => {
    const admin = await TestHelper.createAuthenticatedAdmin(api)

    await api
      .post('/api/admin/faq')
      .set('Cookie', admin.sessionCookie)
      .send({
        question: 'Toinen kysymys',
        blocks: [textBlock('Toinen vastaus')],
        order: 2
      })

    await api
      .post('/api/admin/faq')
      .set('Cookie', admin.sessionCookie)
      .send({
        question: 'Ensimmäinen kysymys',
        blocks: [textBlock('Ensimmäinen vastaus')],
        order: 1
      })

    const response = await api
      .get('/api/faq')
      .set('Cookie', admin.sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body[0].question, 'Ensimmäinen kysymys')
    assert.strictEqual(response.body[1].question, 'Toinen kysymys')
  })

  it('Deleted FAQ is not returned', async () => {
    const admin = await TestHelper.createAuthenticatedAdmin(api)

    const created = await api
      .post('/api/admin/faq')
      .set('Cookie', admin.sessionCookie)
      .send({
        question: 'Poistettava kysymys',
        blocks: [textBlock('Poistettava vastaus')],
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

  it('Returns empty array when there are no FAQs', async () => {
    const admin = await TestHelper.createAuthenticatedAdmin(api)

    const response = await api
      .get('/api/faq')
      .set('Cookie', admin.sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.deepStrictEqual(response.body, [])
  })
})