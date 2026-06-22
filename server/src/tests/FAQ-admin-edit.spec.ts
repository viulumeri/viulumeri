import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import { TestHelper } from '../utils/testHelper'
import supertest from 'supertest'
import app from '../app'
import { Faq } from '../models/FAQ'
import path from 'node:path'
import fs from 'node:fs'

const api = supertest(app)

const blocksJson = (blocks: unknown[]) => JSON.stringify(blocks)

const textBlock = (content: string, order = 0) => ({
  type: 'text',
  content,
  order
})

const createFaq = async (
  sessionCookie: string,
  question: string,
  order: string,
  blocks: unknown[]
) => {
  const response = await api
    .post('/api/admin/faq')
    .set('Cookie', sessionCookie)
    .field('question', question)
    .field('order', order)
    .field('blocks', blocksJson(blocks))

  assert.strictEqual(response.status, 201)

  return response
}

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

    const response = await createFaq(
      admin.sessionCookie,
      'Testikysymys?',
      '1',
      [textBlock('Testivastaus.')]
    )

    assert.strictEqual(response.body.question, 'Testikysymys?')
    assert.strictEqual(response.body.blocks[0].content, 'Testivastaus.')

    const savedFaq = await Faq.findOne({ question: 'Testikysymys?' })

    assert.ok(savedFaq)
    assert.strictEqual(savedFaq.blocks[0].content, 'Testivastaus.')
  })

  it('Admin can delete FAQ', async () => {
    const admin = await TestHelper.createAuthenticatedAdmin(api)

    const created = await createFaq(
      admin.sessionCookie,
      'Poistettava kysymys',
      '1',
      [textBlock('Poistettava vastaus')]
    )

    const response = await api
      .delete(`/api/admin/faq/${created.body._id}`)
      .set('Cookie', admin.sessionCookie)

    assert.strictEqual(response.status, 204)

    const deletedFaq = await Faq.findById(created.body._id)
    assert.strictEqual(deletedFaq, null)
  })

  it('Admin can update FAQ', async () => {
    const admin = await TestHelper.createAuthenticatedAdmin(api)

    const created = await createFaq(
      admin.sessionCookie,
      'Vanha kysymys',
      '1',
      [textBlock('Vanha vastaus')]
    )

    const response = await api
      .put(`/api/admin/faq/${created.body._id}`)
      .set('Cookie', admin.sessionCookie)
      .field('question', 'Uusi kysymys')
      .field('blocks', blocksJson([textBlock('Uusi vastaus')]))

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

    await createFaq(
      admin.sessionCookie,
      'Näkyvä kysymys',
      '1',
      [textBlock('Näkyvä vastaus')]
    )

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

    await createFaq(
      admin.sessionCookie,
      'Toinen kysymys',
      '2',
      [textBlock('Toinen vastaus')]
    )

    await createFaq(
      admin.sessionCookie,
      'Ensimmäinen kysymys',
      '1',
      [textBlock('Ensimmäinen vastaus')]
    )

    const response = await api
      .get('/api/faq')
      .set('Cookie', admin.sessionCookie)

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.body.length, 2)
    assert.strictEqual(response.body[0].question, 'Ensimmäinen kysymys')
    assert.strictEqual(response.body[1].question, 'Toinen kysymys')
  })

  it('Deleted FAQ is not returned', async () => {
    const admin = await TestHelper.createAuthenticatedAdmin(api)

    const created = await createFaq(
      admin.sessionCookie,
      'Poistettava kysymys',
      '1',
      [textBlock('Poistettava vastaus')]
    )

    const deleteResponse = await api
      .delete(`/api/admin/faq/${created.body._id}`)
      .set('Cookie', admin.sessionCookie)

    assert.strictEqual(deleteResponse.status, 204)

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

  it('Admin can create FAQ from multipart form data', async () => {
    const admin = await TestHelper.createAuthenticatedAdmin(api)

    const response = await createFaq(
      admin.sessionCookie,
      'Multipart kysymys?',
      '1',
      [
        {
          type: 'text',
          content: 'Multipart vastaus.',
          order: 0
        }
      ]
    )

    assert.strictEqual(response.body.question, 'Multipart kysymys?')
    assert.strictEqual(response.body.blocks[0].type, 'text')
    assert.strictEqual(response.body.blocks[0].content, 'Multipart vastaus.')

    const savedFaq = await Faq.findOne({ question: 'Multipart kysymys?' })

    assert.ok(savedFaq)
    assert.strictEqual(savedFaq.blocks[0].content, 'Multipart vastaus.')
  })

  it('Admin can create FAQ with image block', async () => {
    const admin = await TestHelper.createAuthenticatedAdmin(api)

    const imagePath = path.join(
      process.cwd(),
      'src/tests/fixtures/faq-test-image.png'
    )

    if (!fs.existsSync(imagePath)) {
      fs.mkdirSync(path.dirname(imagePath), { recursive: true })

      fs.writeFileSync(
        imagePath,
        Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
          'base64'
        )
      )
    }

    const response = await api
      .post('/api/admin/faq')
      .set('Cookie', admin.sessionCookie)
      .field('question', 'Kuvallinen kysymys')
      .field('order', '1')
      .field(
        'blocks',
        blocksJson([
          {
            type: 'image',
            fileKey: 'image_0',
            order: 0
          }
        ])
      )
      .attach('image_0', imagePath)

    assert.strictEqual(response.status, 201)
    assert.strictEqual(response.body.question, 'Kuvallinen kysymys')
    assert.strictEqual(response.body.blocks.length, 1)
    assert.strictEqual(response.body.blocks[0].type, 'image')
    assert.ok(response.body.blocks[0].imageUrl)

    const savedFaq = await Faq.findOne({ question: 'Kuvallinen kysymys' })

    assert.ok(savedFaq)
    assert.strictEqual(savedFaq.blocks.length, 1)
    assert.strictEqual(savedFaq.blocks[0].type, 'image')
    assert.ok(savedFaq.blocks[0].imageUrl)
  })
})