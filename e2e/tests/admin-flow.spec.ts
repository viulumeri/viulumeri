import { test, expect, request, type Page } from '@playwright/test'
import { MongoClient } from 'mongodb'
import { markInstallPromptAsSeen, markStartupAnnouncementsAsSeen } from './announcement-state'

const ADMIN = {
  email: 'e2e-admin@example.com',
  password: 'E2eAdmin123!'
}

const STUDENT = {
  email: 'e2e-student@example.com'
}

const MONGODB_URI =
  process.env.E2E_MONGODB_URI ||
  'mongodb://admin:password@127.0.0.1:27017/viulumeri?authSource=admin'

const API_URL = process.env.BASE_URL || 'http://localhost:3001'

const USER_COLLECTION_CANDIDATES = [
  'user',
  'users',
  'auth_users',
  'better_auth_users'
]

async function findUserCollection(
  db: ReturnType<MongoClient['db']>,
  email: string
) {
  for (const name of USER_COLLECTION_CANDIDATES) {
    const doc = await db.collection(name).findOne({ email })
    if (doc) return name
  }
  return null
}

async function login(
  page: Page,
  email: string,
  password: string,
  suppressAnnouncements = true
) {
  await page.goto('/login')
  if (suppressAnnouncements) {
    await markStartupAnnouncementsAsSeen(page, email)
    await markInstallPromptAsSeen(page)
  }
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)

  const signInResponsePromise = page.waitForResponse(response => {
    return (
      response.url().includes('/api/auth/sign-in/email') &&
      response.request().method() === 'POST'
    )
  })

  await page.locator('form button[type="submit"]').click()

  const signInResponse = await signInResponsePromise
  expect(
    signInResponse.ok(),
    `Sign-in failed: HTTP ${signInResponse.status()}`
  ).toBe(true)

  await page.waitForURL(url => !url.pathname.endsWith('/login'), {
    timeout: 15_000
  })
}

async function cleanupE2eData(disposableEmail: string, runPrefix: string) {
  const mongoClient = new MongoClient(MONGODB_URI)
  await mongoClient.connect()

  try {
    const db = mongoClient.db()
    await db.collection('students').deleteMany({ email: disposableEmail })
    await db.collection('teachers').deleteMany({ email: disposableEmail })
    await db.collection('popupmessages').deleteMany({
      title: { $regex: `^${runPrefix}` }
    })
    await db.collection('faqs').deleteMany({
      question: { $regex: `^${runPrefix}` }
    })
    await db.collection('feedbacks').deleteMany({
      title: { $regex: `^${runPrefix}` }
    })

    for (const collectionName of USER_COLLECTION_CANDIDATES) {
      await db.collection(collectionName).deleteMany({ email: disposableEmail })
    }
  } finally {
    await mongoClient.close()
  }
}

async function createDisposableStudent(user: {
  email: string
  password: string
  name: string
}) {
  const context = await request.newContext({ baseURL: API_URL })

  try {
    const response = await context.post('/api/auth/sign-up/email', {
      data: {
        ...user,
        userType: 'student'
      }
    })

    expect(
      response.ok(),
      `Disposable student sign-up failed: HTTP ${response.status()} ${await response.text()}`
    ).toBe(true)
  } finally {
    await context.dispose()
  }
}

async function seedFeedback(title: string, message: string) {
  const mongoClient = new MongoClient(MONGODB_URI)
  await mongoClient.connect()

  try {
    const db = mongoClient.db()
    const userCollectionName = await findUserCollection(db, STUDENT.email)
    expect(userCollectionName, `Seeded user missing: ${STUDENT.email}`).toBeTruthy()

    const user = await db
      .collection(userCollectionName as string)
      .findOne({ email: STUDENT.email })

    const userId = user?.id ?? user?._id?.toString()
    expect(userId, `Seeded user has no auth id: ${STUDENT.email}`).toBeTruthy()

    await db.collection('feedbacks').insertOne({
      userId,
      userType: 'student',
      title,
      category: 'bug',
      isRead: false,
      message,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  } finally {
    await mongoClient.close()
  }
}

test('admin flow covers dashboard, users, popups, feedback, FAQ, and user view', async ({ page }) => {
  test.setTimeout(120_000)

  const runId = Date.now()
  const runPrefix = `E2E Admin Flow ${runId}`
  const disposableStudent = {
    email: `e2e-admin-flow-delete-${runId}@example.com`,
    password: 'E2eDeleteMe123!',
    name: `${runPrefix} Student`
  }
  const popupTitle = `${runPrefix} popup`
  const updatedPopupTitle = `${runPrefix} popup updated`
  const popupContent = 'Created by the rewritten admin Playwright flow.'
  const updatedPopupContent = 'Updated by the rewritten admin Playwright flow.'
  const faqQuestion = `${runPrefix} question?`
  const updatedFaqQuestion = `${runPrefix} updated question?`
  const faqAnswer = 'This FAQ answer was created in the admin flow.'
  const updatedFaqAnswer = 'This FAQ answer was updated in the admin flow.'
  const feedbackTitle = `${runPrefix} feedback`
  const feedbackMessage = 'This feedback record was seeded for admin flow coverage.'
  const today = new Date().toISOString().slice(0, 10)

  await cleanupE2eData(disposableStudent.email, runPrefix)
  await createDisposableStudent(disposableStudent)
  await seedFeedback(feedbackTitle, feedbackMessage)

  try {
    await login(page, ADMIN.email, ADMIN.password)

    await page.goto('/admin')

    const overviewSection = page.locator('[data-section-id="overview"]')
    await expect(overviewSection).toContainText('Ylläpitopaneeli')
    await expect(overviewSection).toContainText('Lukemattomat')
    await expect(overviewSection).toContainText('Opettajat')
    await expect(overviewSection).toContainText('Oppilaat')

    const usersSection = page.locator('[data-section-id="users"]')
    await usersSection.locator('input[type="text"]').fill(disposableStudent.email)
    await expect(usersSection.getByText(disposableStudent.email)).toBeVisible({
      timeout: 15_000
    })
    await usersSection
      .getByRole('button')
      .filter({ hasText: disposableStudent.email })
      .click()
    await expect(usersSection).toContainText('Opettajaa ei ole asetettu')

    await usersSection.getByLabel('Avaa käyttäjätoiminnot').click()
    const deleteResponsePromise = page.waitForResponse(response => {
      return (
        response.url().includes('/api/admin/students/') &&
        response.request().method() === 'DELETE'
      )
    })
    page.once('dialog', dialog => dialog.accept())
    await usersSection.getByRole('button', { name: 'Poista käyttäjä' }).click()
    const deleteResponse = await deleteResponsePromise
    expect(deleteResponse.ok()).toBe(true)
    await expect(usersSection.getByText(disposableStudent.email)).not.toBeVisible({
      timeout: 15_000
    })

    await page.goto('/admin/popup')
    const popupSection = page.locator('[data-section-id="popup"]')
    const createPopupForm = popupSection.locator('form').first()
    await createPopupForm.locator('#popup-title').fill(popupTitle)
    await createPopupForm.locator('#popup-content').fill(popupContent)
    await createPopupForm.getByLabel('Opettajat').uncheck()
    await createPopupForm.locator('#popup-visible-from').fill(today)
    await createPopupForm.locator('#popup-visible-until').fill(today)

    const createPopupResponsePromise = page.waitForResponse(response => {
      return (
        response.url().includes('/api/admin/popup-messages') &&
        response.request().method() === 'POST'
      )
    })
    await popupSection.getByTestId('popup-create-submit').click()
    const createPopupResponse = await createPopupResponsePromise
    expect(createPopupResponse.ok()).toBe(true)

    let popupCard = popupSection.getByTestId('popup-message-card').filter({ hasText: popupTitle }).first()
    await expect(popupCard).toBeVisible({ timeout: 15_000 })
    await expect(popupCard).toContainText('Oppilaat')
    await expect(popupCard).toContainText('Julkinen')
    await expect(popupCard).toContainText('Voimassa')

    await page.goto('/admin')
    await expect(overviewSection).toContainText(popupTitle)
    await expect(overviewSection).toContainText(popupContent)
    await expect(overviewSection).toContainText('Näkyvyys: Oppilaat')

    await page.goto('/admin/popup')
    popupCard = popupSection.getByTestId('popup-message-card').filter({ hasText: popupTitle }).first()
    await popupCard.getByRole('button', { name: 'Muokkaa' }).click()
    await popupSection.getByRole('textbox', { name: 'Otsikko:' }).nth(1).fill(updatedPopupTitle)
    await popupSection.getByRole('textbox', { name: 'Viesti:' }).nth(1).fill(updatedPopupContent)
    await popupSection.getByLabel('Opettajat').nth(1).check()

    const updatePopupResponsePromise = page.waitForResponse(response => {
      return (
        response.url().includes('/api/admin/popup-messages/') &&
        response.request().method() === 'PATCH'
      )
    })
    await popupSection.getByRole('button', { name: 'Tallenna' }).click()
    const updatePopupResponse = await updatePopupResponsePromise
    expect(updatePopupResponse.ok()).toBe(true)

    popupCard = popupSection.getByTestId('popup-message-card').filter({ hasText: updatedPopupTitle }).first()
    await expect(popupCard).toContainText(updatedPopupContent)
    await expect(popupCard).toContainText('Opettajat, Oppilaat')

    await popupCard.getByRole('switch').click()
    await expect(popupCard).toContainText('Luonnos', { timeout: 15_000 })

    const deletePopupResponsePromise = page.waitForResponse(response => {
      return (
        response.url().includes('/api/admin/popup-messages/') &&
        response.request().method() === 'DELETE'
      )
    })
    page.once('dialog', dialog => dialog.accept())
    await popupCard.getByLabel('Poista pop-up').click()
    const deletePopupResponse = await deletePopupResponsePromise
    expect(deletePopupResponse.ok()).toBe(true)
    await expect(popupSection.getByText(updatedPopupTitle)).not.toBeVisible({
      timeout: 15_000
    })

    await page.goto('/admin/feedback')
    const feedbackSection = page.locator('[data-section-id="feedback"]')
    const feedbackCard = feedbackSection.locator('li').filter({ hasText: feedbackTitle })
    await expect(feedbackCard).toBeVisible({ timeout: 15_000 })
    await expect(feedbackCard).toContainText(feedbackMessage)
    await expect(feedbackCard).toContainText(STUDENT.email)

    const feedbackReadResponsePromise = page.waitForResponse(response => {
      return (
        response.url().includes('/api/admin/feedbacks/') &&
        response.request().method() === 'PATCH'
      )
    })
    await feedbackCard.getByRole('checkbox', { name: 'Luettu' }).click()
    const feedbackReadResponse = await feedbackReadResponsePromise
    expect(feedbackReadResponse.ok()).toBe(true)

    const deleteFeedbackResponsePromise = page.waitForResponse(response => {
      return (
        response.url().includes('/api/admin/feedbacks/') &&
        response.request().method() === 'DELETE'
      )
    })

    page.once('dialog', dialog => dialog.accept())

    await feedbackCard.getByRole('button', { name: 'Poista' }).click()

    const deleteFeedbackResponse = await deleteFeedbackResponsePromise
    expect(deleteFeedbackResponse.ok()).toBe(true)

    await expect(feedbackSection.getByText(feedbackTitle)).not.toBeVisible({
      timeout: 15_000
    })

    await page.goto('/admin/faq')
    const faqSection = page.locator('[data-section-id="faq"]')
    await faqSection.getByRole('button').filter({ hasText: 'Lisää uusi kysymys' }).click()
    await faqSection.locator('input[placeholder="Kirjoita kysymys"]').fill(faqQuestion)
    await faqSection.locator('textarea[placeholder="Kirjoita vastaus"]').fill(faqAnswer)

    const createFaqResponsePromise = page.waitForResponse(response => {
      return (
        response.url().includes('/api/admin/faq') &&
        response.request().method() === 'POST'
      )
    })
    await faqSection.getByRole('button', { name: 'Lisää kysymys' }).click()
    const createFaqResponse = await createFaqResponsePromise
    expect(createFaqResponse.ok()).toBe(true)

    await faqSection.getByRole('button').filter({ hasText: 'Selaa ja muokkaa' }).click()
    await faqSection.getByRole('button', { name: faqQuestion }).click()
    await expect(faqSection).toContainText(faqAnswer)
    await faqSection.getByRole('button', { name: 'Muokkaa', exact: true }).click()
    await faqSection.locator(`input[value="${faqQuestion}"]`).fill(updatedFaqQuestion)
    await faqSection.locator('textarea').last().fill(updatedFaqAnswer)

    const updateFaqResponsePromise = page.waitForResponse(response => {
      return (
        response.url().includes('/api/admin/faq/') &&
        response.request().method() === 'PUT'
      )
    })
    await faqSection.getByRole('button', { name: 'Tallenna' }).click()
    const updateFaqResponse = await updateFaqResponsePromise
    expect(updateFaqResponse.ok()).toBe(true)

    await expect(faqSection.getByRole('button', { name: updatedFaqQuestion })).toBeVisible()
    await expect(faqSection).toContainText(updatedFaqAnswer)

    const deleteFaqResponsePromise = page.waitForResponse(response => {
      return (
        response.url().includes('/api/admin/faq/') &&
        response.request().method() === 'DELETE'
      )
    })
    await faqSection.getByRole('button', { name: 'Poista' }).click()
    const deleteFaqResponse = await deleteFaqResponsePromise
    expect(deleteFaqResponse.ok()).toBe(true)
    await expect(faqSection.getByText(updatedFaqQuestion)).not.toBeVisible({
      timeout: 15_000
    })

    await page.goto('/admin/user-view')
    const userViewSection = page.locator('[data-section-id="user-view"]')
    await expect(userViewSection).toContainText('Käyttäjänäkymä')
    await userViewSection
      .getByRole('button', { name: 'Siirry käyttäjänäkymään' })
      .click()
    await page.waitForURL(/\/student\/homework/, { timeout: 15_000 })
  } finally {
    await cleanupE2eData(disposableStudent.email, runPrefix)
  }
})
