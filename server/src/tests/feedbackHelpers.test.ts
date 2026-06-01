import { describe, it } from 'node:test'
import assert from 'node:assert'
import { mapFeedbacksToAdminItems } from '../utils/feedbackHelpers'
import type { AdminFeedbackItem } from '../../../shared/types'

const makeDate = (iso: string) => new Date(iso)

const baseFeedback: {
  id: string
  userId: string
  userType: AdminFeedbackItem['userType']
  title: string
  category: AdminFeedbackItem['category']
  message: string
  createdAt: Date
} = {
  id: 'f1',
  userId: 'u1',
  userType: 'teacher',
  title: 'Test title',
  category: 'bug',
  message: 'Test message',
  createdAt: makeDate('2024-03-01T10:00:00.000Z')
}

describe('mapFeedbacksToAdminItems', () => {
  it('should return empty array when feedbacks is empty', () => {
    const result = mapFeedbacksToAdminItems([], [], [])
    assert.deepStrictEqual(result, [])
  })

  it('should map sender name and email from matching teacher', () => {
    const result = mapFeedbacksToAdminItems(
      [baseFeedback],
      [{ userId: 'u1', name: 'Outi Opettaja', email: 'outi@example.com' }],
      []
    )

    assert.strictEqual(result.length, 1)
    assert.strictEqual(result[0].senderName, 'Outi Opettaja')
    assert.strictEqual(result[0].senderEmail, 'outi@example.com')
    assert.strictEqual(result[0].userType, 'teacher')
  })

  it('should map sender name and email from matching student', () => {
    const feedback = { ...baseFeedback, id: 'f2', userId: 'u2', userType: 'student' as const }

    const result = mapFeedbacksToAdminItems(
      [feedback],
      [],
      [{ userId: 'u2', name: 'Olli Oppilas', email: 'olli@example.com' }]
    )

    assert.strictEqual(result[0].senderName, 'Olli Oppilas')
    assert.strictEqual(result[0].senderEmail, 'olli@example.com')
    assert.strictEqual(result[0].userType, 'student')
  })

  it('should use fallback values when user is not found', () => {
    const result = mapFeedbacksToAdminItems([baseFeedback], [], [])

    assert.strictEqual(result[0].senderName, 'Poistettu käyttäjä')
    assert.strictEqual(result[0].senderEmail, '')
  })

  it('should correctly map all fields', () => {
    const result = mapFeedbacksToAdminItems(
      [baseFeedback],
      [{ userId: 'u1', name: 'Outi Opettaja', email: 'outi@example.com' }],
      []
    )

    const item = result[0]
    assert.strictEqual(item.id, 'f1')
    assert.strictEqual(item.title, 'Test title')
    assert.strictEqual(item.category, 'bug')
    assert.strictEqual(item.message, 'Test message')
    assert.strictEqual(item.createdAt, '2024-03-01T10:00:00.000Z')
  })

  it('should handle multiple feedbacks from different user types', () => {
    const feedbacks = [
      { ...baseFeedback, id: 'f1', userId: 'u1', userType: 'teacher' as const },
      { ...baseFeedback, id: 'f2', userId: 'u2', userType: 'student' as const }
    ]

    const result = mapFeedbacksToAdminItems(
      feedbacks,
      [{ userId: 'u1', name: 'Outi Opettaja', email: 'outi@example.com' }],
      [{ userId: 'u2', name: 'Olli Oppilas', email: 'olli@example.com' }]
    )

    assert.strictEqual(result.length, 2)
    assert.strictEqual(result[0].senderName, 'Outi Opettaja')
    assert.strictEqual(result[1].senderName, 'Olli Oppilas')
  })
})
