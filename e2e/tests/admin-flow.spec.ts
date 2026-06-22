import { test, expect, request, type Page, type APIRequestContext } from '@playwright/test'
import fs from 'fs/promises'
import path from 'path'
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

async function createAdminApiContext(): Promise<APIRequestContext> {
  const context = await request.newContext({ baseURL: API_URL })
  const response = await context.post('/api/auth/sign-in/email', {
    data: {
      email: ADMIN.email,
      password: ADMIN.password
    }
  })

  expect(
    response.ok(),
    `Admin API sign-in failed: HTTP ${response.status()} ${await response.text()}`
  ).toBe(true)

  return context
}

async function cleanupE2eSongs(runPrefix: string) {
  const context = await createAdminApiContext()

  try {
    const response = await context.get('/api/admin/songs')
    if (!response.ok()) return

    const body = await response.json() as {
      songs?: { id: string; title: string }[]
    }
    const songs = body.songs ?? []

    await Promise.all(
      songs
        .filter(song => song.title.startsWith(runPrefix))
        .map(song => context.delete(`/api/admin/songs/${encodeURIComponent(song.id)}`))
    )
  } finally {
    await context.dispose()
  }
}

const songFileInput = (page: Page, label: RegExp | string) =>
  page
    .locator('[data-section-id="songs"] label')
    .filter({ hasText: label })
    .locator('input[type="file"]')
    .first()

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
  const songTitle = `${runPrefix} song`
  const updatedSongTitle = `${runPrefix} song updated`
  const songComposer = `${runPrefix} composer`
  const fixtureImage = await fs.readFile(
    path.join(
      __dirname,
      '..',
      '..',
      'server',
      'src',
      'tests',
      'fixtures',
      'music',
      'valid-song-1',
      'images',
      'original.jpg'
    )
  )
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  await cleanupE2eData(disposableStudent.email, runPrefix)
  await cleanupE2eSongs(runPrefix)
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

    await page.goto('/admin/songs')
    const songsSection = page.locator('[data-section-id="songs"]')
    await expect(songsSection).toContainText('Kappaleet')
    await songsSection.getByRole('button', { name: /Lis.* kappale/ }).click()

    await songsSection.locator('#admin-song-name').fill(songTitle)
    await songsSection.locator('#admin-song-composer').fill(songComposer)
    await songFileInput(page, /^Instrumentaali/).setInputFiles({
      name: 'e2e-backing.mp3',
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('e2e regular backing')
    })
    await songFileInput(page, /^Melodia/).setInputFiles({
      name: 'e2e-melody.mp3',
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('e2e regular melody')
    })
    await songFileInput(page, /^Kappaleen kuva/).setInputFiles({
      name: 'e2e-cover.jpg',
      mimeType: 'image/jpeg',
      buffer: fixtureImage
    })

    const createSongResponsePromise = page.waitForResponse(response => {
      return (
        response.url().includes('/api/admin/songs') &&
        response.request().method() === 'POST'
      )
    })
    await songsSection.getByRole('button', { name: 'Tallenna' }).click()
    const createSongResponse = await createSongResponsePromise
    expect(
      createSongResponse.ok(),
      `Create song failed: HTTP ${createSongResponse.status()} ${await createSongResponse.text()}`
    ).toBe(true)

    await songsSection.locator('input[placeholder="Etsi kappaleita..."]').fill(songTitle)
    let songTitleButton = songsSection.getByRole('button', {
      name: songTitle,
      exact: true
    })
    await expect(songTitleButton).toBeVisible({ timeout: 15_000 })
    let songRow = songTitleButton.locator('xpath=ancestor::div[contains(@class, "grid")][1]')
    await expect(songRow).toContainText('Piilotettu')
    await expect(songRow).toContainText('Instrumentaali')
    await expect(songRow).toContainText('Melodia')

    const publishSongResponsePromise = page.waitForResponse(response => {
      return (
        response.url().includes('/api/admin/songs/') &&
        response.request().method() === 'PATCH'
      )
    })
    await songRow.getByRole('switch', { name: /julkiseksi/ }).click()
    const publishSongResponse = await publishSongResponsePromise
    expect(
      publishSongResponse.ok(),
      `Publish song failed: HTTP ${publishSongResponse.status()} ${await publishSongResponse.text()}`
    ).toBe(true)
    await expect(songRow).toContainText('Julkinen', { timeout: 15_000 })

    await songRow.getByLabel('Muokkaa kappaletta').click()
    await songsSection.locator('#admin-song-name').fill(updatedSongTitle)
    await songFileInput(page, /^Hidas instrumentaali/).setInputFiles({
      name: 'e2e-slow-backing.mp3',
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('e2e slow backing')
    })

    const updateSongResponsePromise = page.waitForResponse(response => {
      return (
        response.url().includes('/api/admin/songs/') &&
        response.request().method() === 'PATCH'
      )
    })
    await songsSection.getByRole('button', { name: 'Tallenna' }).click()
    const updateSongResponse = await updateSongResponsePromise
    expect(
      updateSongResponse.ok(),
      `Update song failed: HTTP ${updateSongResponse.status()} ${await updateSongResponse.text()}`
    ).toBe(true)

    await songsSection.locator('input[placeholder="Etsi kappaleita..."]').fill(updatedSongTitle)
    songTitleButton = songsSection.getByRole('button', {
      name: updatedSongTitle,
      exact: true
    })
    await expect(songTitleButton).toBeVisible({ timeout: 15_000 })
    songRow = songTitleButton.locator('xpath=ancestor::div[contains(@class, "grid")][1]')
    await expect(songRow).toContainText('Hidas instr.')

    const deleteSongResponsePromise = page.waitForResponse(response => {
      return (
        response.url().includes('/api/admin/songs/') &&
        response.request().method() === 'DELETE'
      )
    })
    page.once('dialog', dialog => dialog.accept())
    await songRow.getByLabel('Poista kappale').click()
    const deleteSongResponse = await deleteSongResponsePromise
    expect(
      deleteSongResponse.ok(),
      `Delete song failed: HTTP ${deleteSongResponse.status()} ${await deleteSongResponse.text()}`
    ).toBe(true)
    await expect(
      songsSection.getByRole('button', {
        name: updatedSongTitle,
        exact: true
      })
    ).not.toBeVisible({ timeout: 15_000 })

    await page.goto('/admin/popup')
    const popupSection = page.locator('[data-section-id="popup"]')
    const createPopupForm = popupSection.locator('form').first()
    await createPopupForm.locator('#popup-title').fill(popupTitle)
    await createPopupForm.locator('#popup-content').fill(popupContent)
    await createPopupForm.locator('#popup-images').setInputFiles({
      name: 'popup-image.jpg',
      mimeType: 'image/jpeg',
      buffer: fixtureImage
    })
    await createPopupForm.getByLabel('Opettajat').uncheck()
    await createPopupForm.locator('#popup-visible-from').fill(today)
    await createPopupForm.locator('#popup-visible-until').fill(today)
    await createPopupForm.getByRole('switch').click()

    const createPopupResponsePromise = page.waitForResponse(response => {
      return (
        response.url().includes('/api/admin/popup-messages') &&
        response.request().method() === 'POST'
      )
    })
    await popupSection.getByTestId('popup-create-submit').click()
    const createPopupResponse = await createPopupResponsePromise
    expect(createPopupResponse.ok()).toBe(true)
    const createPopupBody = (await createPopupResponse.json()) as {
      message?: { images?: unknown[] }
    }
    expect(createPopupBody.message?.images).toHaveLength(1)

    let popupCard = popupSection.getByTestId('popup-message-card').filter({ hasText: popupTitle }).first()
    await expect(popupCard).toBeVisible({ timeout: 15_000 })
    await expect(popupCard).toContainText('Oppilaat')
    await expect(popupCard).toContainText('Julkaistu')
    await expect(popupCard).toContainText('Voimassa')
    await expect(popupCard.locator('img[alt="popup-image.jpg"]')).toBeVisible()

    await page.goto('/admin')
    await expect(overviewSection).toContainText(popupTitle)
    await expect(overviewSection).toContainText(popupContent)
    await expect(overviewSection.locator('img[alt="popup-image.jpg"]')).toBeVisible()
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
    await popupSection.getByRole('button', { name: 'Tallenna', exact: true }).click()
    const updatePopupResponse = await updatePopupResponsePromise
    expect(updatePopupResponse.ok()).toBe(true)
    const updatePopupBody = (await updatePopupResponse.json()) as {
      message?: { images?: unknown[] }
    }
    expect(updatePopupBody.message?.images).toHaveLength(1)

    popupCard = popupSection.getByTestId('popup-message-card').filter({ hasText: updatedPopupTitle }).first()
    await expect(popupCard).toContainText(updatedPopupContent)
    await expect(popupCard).toContainText('Opettajat, Oppilaat')
    await expect(popupCard.locator('img[alt="popup-image.jpg"]')).toBeVisible()

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

  await faqSection.getByRole('button', { name: 'Lisää tekstiosio' }).click()
  await faqSection
  .locator('textarea[placeholder="Kirjoita tekstiosion sisältö"]')
  .fill(faqAnswer)

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

    await page.goto('/settings')
    await page
      .getByRole('button', { name: /Usein kysytyt kysymykset/ })
      .click()
    await expect(page.getByText(updatedFaqQuestion)).toBeVisible()
    await page.getByRole('button', { name: updatedFaqQuestion }).click()
    await expect(page.getByText(updatedFaqAnswer)).toBeVisible()
    await expect(page.getByText(faqQuestion)).not.toBeAttached()
    await expect(page.getByText(faqAnswer)).not.toBeAttached()

    await page.goto('/admin/faq')
    await faqSection.getByRole('button').filter({ hasText: 'Selaa ja muokkaa' }).click()
    await faqSection.getByRole('button', { name: updatedFaqQuestion }).click()

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
    await cleanupE2eSongs(runPrefix)
  }
})

test('admin can impersonate a user and stop from the mobile banner', async ({ page }) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 320, height: 720 })
  await login(page, ADMIN.email, ADMIN.password)
  await page.goto('/admin')

  const usersSection = page.locator('[data-section-id="users"]')
  await usersSection.locator('input[type="text"]').fill(STUDENT.email)
  await usersSection
    .getByRole('button')
    .filter({ hasText: STUDENT.email })
    .click()
  await usersSection.getByLabel('Avaa käyttäjätoiminnot').click()

  const impersonateResponsePromise = page.waitForResponse(response => {
    return (
      response.url().includes('/api/auth/admin/impersonate-user') &&
      response.request().method() === 'POST'
    )
  })
  await usersSection.getByRole('button', { name: 'Impersonoi' }).click()
  const impersonateResponse = await impersonateResponsePromise
  expect(impersonateResponse.ok()).toBe(true)

  const authCookies = await page.context().cookies()
  expect(authCookies.some(cookie => cookie.name === 'better-auth.session_token')).toBe(true)
  expect(authCookies.some(cookie => cookie.name === 'better-auth.admin_session')).toBe(true)

  await page.waitForURL(/\/student\/homework/, { timeout: 15_000 })
  const bannerToggle = page.getByRole('button', {
    name: 'Session hallinta'
  })
  await bannerToggle.click()

  const stopButton = page.getByRole('button', { name: 'Lopeta sessio' })
  await expect(stopButton).toBeVisible()

  const stopButtonBounds = await stopButton.boundingBox()
  expect(stopButtonBounds).not.toBeNull()
  expect(stopButtonBounds!.x).toBeGreaterThanOrEqual(0)
  expect(stopButtonBounds!.x + stopButtonBounds!.width).toBeLessThanOrEqual(320)

  const stopResponsePromise = page.waitForResponse(response => {
    return (
      response.url().includes('/api/auth/admin/stop-impersonating') &&
      response.request().method() === 'POST'
    )
  })
  await stopButton.click()
  const stopResponse = await stopResponsePromise
  expect(stopResponse.ok()).toBe(true)

  await page.waitForURL('/admin', { timeout: 15_000 })
})
