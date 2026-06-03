import { test, expect, type Page, type APIRequestContext } from '@playwright/test'
import { MongoClient } from 'mongodb'
import { markStartupAnnouncementsAsSeen } from './announcement-state'

const ADMIN = {
  email: 'e2e-admin@example.com',
  password: 'E2eAdmin123!'
}

const DELETE_ME = {
  email: 'e2e-delete-me@example.com',
  password: 'E2eDeleteMe123!',
  name: 'E2E Delete Me',
  userType: 'student'
}

const STUDENT = {
  email: 'e2e-student@example.com',
  password: 'E2eStudent123!',
  name: 'E2E Student',
  userType: 'student'
}

const TEACHER = {
  email: 'e2e-teacher@example.com',
  password: 'E2eTeacher123!',
  name: 'E2E Teacher',
  userType: 'teacher'
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

const addDays = (base: Date, offset: number) =>
  new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset)

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function createPopupMessage(
  page: Page,
  options: {
    title: string
    content: string
    isDraft?: boolean
    visibleToTeachers?: boolean
    visibleToStudents?: boolean
    visibleFrom?: string
    visibleUntil?: string
  }
) {
  await page.goto('/admin/popup')

  await page.locator('#popup-title').fill(options.title)
  await page.locator('#popup-content').fill(options.content)

  const teachersToggle = page.getByLabel('Opettajat', { exact: true })
  const studentsToggle = page.getByLabel('Oppilaat', { exact: true })
  await teachersToggle.setChecked(options.visibleToTeachers ?? true)
  await studentsToggle.setChecked(options.visibleToStudents ?? true)

  await page.getByLabel('Luonnos', { exact: true }).setChecked(Boolean(options.isDraft))

  if (options.visibleFrom !== undefined) {
    await page.locator('#popup-visible-from').fill(options.visibleFrom)
  }
  if (options.visibleUntil !== undefined) {
    await page.locator('#popup-visible-until').fill(options.visibleUntil)
  }

  await page.getByRole('button', { name: /lähetä|tallenna luonnos/i }).click()

  await expect(
    page.getByText(options.isDraft ? 'Luonnos tallennettu' : 'Pop-up lähetetty')
  ).toBeVisible({ timeout: 15_000 })
}

const USER_COLLECTION_CANDIDATES = [
  'user',
  'users',
  'auth_users',
  'better_auth_users'
]

async function ensureUserExists(
  request: APIRequestContext,
  user: { email: string; password: string; name: string; userType: string }
) {
  const response = await request.post('/api/auth/sign-up/email', { data: user })
  if (response.ok()) return

  const body = await response.text()
  const status = response.status()
  const normalized = body.toLowerCase()
  const alreadyExists =
    normalized.includes('exists') || normalized.includes('already')

  if ((status === 400 || status === 409) && alreadyExists) return

  throw new Error(`Failed to seed ${user.email}: ${status} ${body}`)
}

test('admin flow test', async ({ page, request }) => {
  test.setTimeout(90_000)

  const now = new Date()
  const yesterday = toDateInputValue(addDays(now, -1))
  const tomorrow = toDateInputValue(addDays(now, 1))
  const nextWeek = toDateInputValue(addDays(now, 7))

  const draftPopupTitle = `E2E draft popup ${Date.now()}`
  const draftPopupContent = 'Draft popup should never reach end users.'
  const teacherOnlyTitle = `E2E teacher-only ${Date.now()}`
  const teacherOnlyContent = 'Only teachers should see this.'
  const expiredTitle = `E2E expired ${Date.now()}`
  const expiredContent = 'Expired popup should not be visible.'
  const upcomingTitle = `E2E upcoming ${Date.now()}`
  const upcomingContent = 'Upcoming popup should not be visible yet.'
  const timedTitle = `E2E timed active ${Date.now()}`
  const timedContent = 'Timed popup should be visible right now.'
  const editableTitle = `E2E editable popup ${Date.now()}`
  const editableContent = 'Editable popup content.'
  const editedTitle = `E2E edited popup ${Date.now()}`
  const editedContent = 'Edited popup content.'

  await ensureUserExists(request, DELETE_ME)
  await ensureUserExists(request, TEACHER)

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

  // 3) Create popups covering draft, audience, and visibility windows.
  await createPopupMessage(page, {
    title: draftPopupTitle,
    content: draftPopupContent,
    isDraft: true
  })

  await createPopupMessage(page, {
    title: teacherOnlyTitle,
    content: teacherOnlyContent,
    visibleToTeachers: true,
    visibleToStudents: false
  })

  await createPopupMessage(page, {
    title: expiredTitle,
    content: expiredContent,
    visibleFrom: yesterday,
    visibleUntil: yesterday
  })

  // 4) Seed a feedback and verify the admin feedback view.
  const feedbackMongoClient = new MongoClient(MONGODB_URI)
  await feedbackMongoClient.connect()
  try {
    const db = feedbackMongoClient.db()
    let teacherAuthUser = null
    for (const collName of USER_COLLECTION_CANDIDATES) {
      teacherAuthUser = await db.collection(collName).findOne({ email: TEACHER.email })
      if (teacherAuthUser) break
    }
    const teacherUserId = (teacherAuthUser as { _id?: { toString(): string } })?._id?.toString() ?? 'unknown'

    await db.collection('feedbacks').insertOne({
      userId: teacherUserId,
      userType: 'teacher',
      title: 'E2E feedback title',
      category: 'bug',
      message: 'E2E feedback message from admin flow test.',
      createdAt: new Date(),
      updatedAt: new Date()
    })
  } finally {
    await feedbackMongoClient.close()
  }

  const feedbackResponsePromise = page.waitForResponse(response => {
    return (
      response.url().includes('/api/admin/feedbacks') &&
      response.request().method() === 'GET'
    )
  })

  await page.goto('/admin')
  await page.getByRole('link', { name: 'Palautteet' }).click()
  const feedbackResponse = await feedbackResponsePromise
  expect(
    feedbackResponse.ok(),
    `GET /api/admin/feedbacks failed: HTTP ${feedbackResponse.status()}`
  ).toBe(true)
  await expect(page).toHaveURL(/\/admin\/feedback/)
  await expect(page.getByRole('heading', { name: 'Palautteet' })).toBeVisible()
  const feedbackItem = page.locator('li').filter({ hasText: 'E2E feedback title' })
  await expect(feedbackItem).toBeVisible({ timeout: 15_000 })
  await expect(feedbackItem.getByText('Bugiraportti', { exact: true })).toBeVisible()
  await expect(feedbackItem.getByText('Opettaja', { exact: true })).toBeVisible()
  await expect(feedbackItem.getByText('E2E Teacher', { exact: true })).toBeVisible()
  await expect(feedbackItem.getByText('E2E feedback message from admin flow test.')).toBeVisible()

  // 5) Log out.
  await page.goto('/settings')
  await page.getByRole('button', { name: /kirjaudu ulos/i }).click()
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })

  // 5) Log in as a normal user and verify the popup shows up.
  await login(page, STUDENT.email, STUDENT.password)

  const dialog = page.getByRole('dialog', { name: 'Ilmoitukset' })
  await expect(dialog).toBeVisible({ timeout: 15_000 })
  await expect(dialog).toContainText(timedTitle)
  await expect(dialog).toContainText(timedContent)
  await expect(dialog).not.toContainText(draftPopupTitle)
  await expect(dialog).not.toContainText(teacherOnlyTitle)
  await expect(dialog).not.toContainText(expiredTitle)
  await expect(dialog).not.toContainText(upcomingTitle)
  await expect(dialog).not.toContainText(editedTitle)

  await page.getByRole('button', { name: 'OK' }).click()
  await expect(dialog).not.toBeVisible({ timeout: 15_000 })

  // 9) Log in as a teacher to verify teacher-only popup.
  await page.goto('/settings')
  await page.getByRole('button', { name: /kirjaudu ulos/i }).click()
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })

  await login(page, TEACHER.email, TEACHER.password)
  const teacherDialog = page.getByRole('dialog', { name: 'Ilmoitukset' })
  await expect(teacherDialog).toBeVisible({ timeout: 15_000 })
  await expect(teacherDialog).toContainText(teacherOnlyTitle)
  await page.getByRole('button', { name: 'OK' }).click()
  await expect(teacherDialog).not.toBeVisible({ timeout: 15_000 })

  const mongoClient = new MongoClient(MONGODB_URI)
  await mongoClient.connect()
  try {
    await mongoClient.db().collection('popupmessages').deleteMany({})
    await mongoClient.db().collection('feedbacks').deleteMany({})
  } finally {
    await mongoClient.close()
  }
})