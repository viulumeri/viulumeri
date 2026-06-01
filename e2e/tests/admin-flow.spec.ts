import { test, expect, type Page } from '@playwright/test'
import { MongoClient } from 'mongodb'
import { markStartupAnnouncementsAsSeen } from './announcement-state'

const ADMIN = {
  email: 'e2e-admin@example.com',
  password: 'E2eAdmin123!'
}

const DELETE_ME = {
  email: 'e2e-delete-me@example.com'
}

const STUDENT = {
  email: 'e2e-student@example.com',
  password: 'E2eStudent123!'
}

const TEACHER = {
  email: 'e2e-teacher@example.com'
}

const MONGODB_URI =
  process.env.E2E_MONGODB_URI ||
  'mongodb://admin:password@127.0.0.1:27017/viulumeri?authSource=admin'

async function login(
  page: Page,
  email: string,
  password: string,
  suppressAnnouncements = false
) {
  await page.goto('/login')
  if (suppressAnnouncements) {
    await markStartupAnnouncementsAsSeen(page, email)
  }
  await page.getByPlaceholder('Sähköpostiosoite').fill(email)
  await page.getByPlaceholder('Salasana').fill(password)

  const signInResponsePromise = page.waitForResponse(response => {
    return (
      response.url().includes('/api/auth/sign-in/email') &&
      response.request().method() === 'POST'
    )
  })

  await page.getByRole('button', { name: /kirjaudu sisään/i }).click()

  const signInResponse = await signInResponsePromise
  expect(
    signInResponse.ok(),
    `Sign-in failed: HTTP ${signInResponse.status()}`
  ).toBe(true)

  await page.waitForURL(url => !url.pathname.endsWith('/login'), {
    timeout: 15_000,
  })
}

test('admin can delete user, create popup, and user sees popup', async ({ page }) => {
  test.setTimeout(60_000)

  const popupTitle = `E2E popup ${Date.now()}`
  const popupContent = 'Hello from Playwright admin-flow test.'

  // 1) Log in as admin.
  await login(page, ADMIN.email, ADMIN.password, true)

  // 2) Search the test user from AdminPanel and delete them.
  await page.goto('/admin')

  const [teachersResponse, studentsResponse] = await Promise.all([
    page.waitForResponse(response => {
      return (
        response.url().includes('/api/admin/teachers') &&
        response.request().method() === 'GET'
      )
    }),
    page.waitForResponse(response => {
      return (
        response.url().includes('/api/admin/students') &&
        response.request().method() === 'GET'
      )
    })
  ])

  expect(
    teachersResponse.ok(),
    `GET /api/admin/teachers failed: HTTP ${teachersResponse.status()}`
  ).toBe(true)
  expect(
    studentsResponse.ok(),
    `GET /api/admin/students failed: HTTP ${studentsResponse.status()}`
  ).toBe(true)

  const studentsBody = (await studentsResponse.json().catch(() => null)) as any
  expect(
    Array.isArray(studentsBody?.students),
    'Expected /api/admin/students JSON { students: [] }'
  ).toBe(true)
  expect(
    studentsBody.students.some((s: any) => s?.email === DELETE_ME.email),
    `Seeded student missing from /api/admin/students: ${DELETE_ME.email}`
  ).toBe(true)

  const searchInput = page.getByPlaceholder('Etsi käyttäjiä...')
  const option = page.getByText(DELETE_ME.email).first()

  await expect
    .poll(
      async () => {
        await searchInput.fill('')
        await searchInput.type(DELETE_ME.email, { delay: 10 })
        return await option.isVisible().catch(() => false)
      },
      { timeout: 10_000 }
    )
    .toBe(true)

  await option.click()

  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Poista käyttäjä' }).click()

  await expect(page.getByText('Käyttäjä poistettu onnistuneesti')).toBeVisible({
    timeout: 15_000,
  })

  // 3) Create a popup.
  await page.goto('/admin/popup')
  await page.locator('#popup-title').fill(popupTitle)
  await page.locator('#popup-content').fill(popupContent)
  await page.getByRole('button', { name: /^lähetä$/i }).click()

  await expect(page.getByText('Pop-up lähetetty')).toBeVisible({ timeout: 15_000 })
  await markStartupAnnouncementsAsSeen(page, ADMIN.email)

  // 4) Seed a feedback and verify the admin feedback view.
  const feedbackMongoClient = new MongoClient(MONGODB_URI)
  await feedbackMongoClient.connect()
  try {
    const db = feedbackMongoClient.db()
    const teacherAuthUser =
      await db.collection('user').findOne({ email: TEACHER.email }) ??
      await db.collection('users').findOne({ email: TEACHER.email })
    const teacherUserId = (teacherAuthUser as any)?._id?.toString() ?? 'unknown'

    await db.collection('feedbacks').insertOne({
      userId: teacherUserId,
      userType: 'teacher',
      title: 'E2E feedback title',
      category: 'bug',
      message: 'E2E feedback message from admin flow test.',
      createdAt: new Date()
    })
  } finally {
    await feedbackMongoClient.close()
  }

  await page.goto('/admin')
  await page.getByRole('link', { name: 'Palauteet' }).click()
  await expect(page).toHaveURL(/\/admin\/feedback/)
  await expect(page.getByRole('heading', { name: 'Palautteet' })).toBeVisible()
  const feedbackItem = page.locator('li').filter({ hasText: 'E2E feedback title' })
  await expect(feedbackItem).toBeVisible()
  await expect(feedbackItem.getByText('Bugiraportti', { exact: true })).toBeVisible()
  await expect(feedbackItem.getByText('Opettaja', { exact: true })).toBeVisible()
  await expect(feedbackItem.getByText('E2E Teacher', { exact: true })).toBeVisible()
  await expect(feedbackItem.getByText('E2E feedback message from admin flow test.')).toBeVisible()

  // 5) Log out.
  await page.goto('/settings')
  await page.getByRole('button', { name: /kirjaudu ulos/i }).click()
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })

  // 6) Log in as a normal user and verify the popup shows up.
  await login(page, STUDENT.email, STUDENT.password)

  const dialog = page.getByRole('dialog', { name: 'Ilmoitukset' })
  await expect(dialog).toBeVisible({ timeout: 15_000 })
  await expect(dialog).toContainText(popupTitle)
  await expect(dialog).toContainText(popupContent)

  await page.getByRole('button', { name: 'OK' }).click()
  await expect(dialog).not.toBeVisible({ timeout: 15_000 })

  const mongoClient = new MongoClient(MONGODB_URI)
  await mongoClient.connect()
  try {
    await mongoClient.db().collection('popupmessages').deleteMany({})
    await mongoClient.db().collection('feedbacks').deleteMany({})
  } finally {
    await mongoClient.close()
  }
})
