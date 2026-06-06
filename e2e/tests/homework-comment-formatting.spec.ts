import { test, expect, request, type Page } from '@playwright/test'
import { markStartupAnnouncementsAsSeen } from './announcement-state'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'
const TEACHER = { email: 'e2e-teacher@example.com', password: 'E2eTeacher123!' }
const STUDENT = { email: 'e2e-student@example.com', password: 'E2eStudent123!' }

let studentId: string
let homeworkId: string

test.beforeAll(async () => {
  const teacherCtx = await request.newContext({ baseURL: BASE_URL })
  const studentCtx = await request.newContext({ baseURL: BASE_URL })

  try {
    const teacherSignIn = await teacherCtx.post('/api/auth/sign-in/email', {
      data: TEACHER,
    })
    expect(teacherSignIn.ok()).toBeTruthy()

    // Generate invite link for student
    const inviteRes = await teacherCtx.post('/api/invites')
    expect(inviteRes.ok()).toBeTruthy()
    const { inviteUrl } = await inviteRes.json()
    const token = inviteUrl.split('/invite/')[1]

    const studentSignIn = await studentCtx.post('/api/auth/sign-in/email', {
      data: STUDENT,
    })
    expect(studentSignIn.ok()).toBeTruthy()

    // Student accepts teacher's invite
    const acceptRes = await studentCtx.post(`/api/invites/${token}/accept`)
    expect(acceptRes.ok()).toBeTruthy()

    // Get student's profile ID from teacher's student list
    const studentsRes = await teacherCtx.get('/api/students')
    expect(studentsRes.ok()).toBeTruthy()
    const { students } = await studentsRes.json()
    const student = students.find((s: { id: string; name: string }) => s.name === 'E2E Student')
    expect(student).toBeDefined()
    studentId = student.id

    // Delete any leftover homework from previous runs
    const existingHwRes = await teacherCtx.get(`/api/students/${studentId}/homework`)
    expect(existingHwRes.ok()).toBeTruthy()
    const { homework: existingHomework } = await existingHwRes.json()
    for (const hw of existingHomework) {
      const deleteRes = await teacherCtx.delete(`/api/homework/${hw.id}`)
      expect(deleteRes.ok()).toBeTruthy()
    }

    // Create a homework assignment for the student
    const hwRes = await teacherCtx.post('/api/homework', {
      data: { studentId, songs: [], comment: '' },
    })
    expect(hwRes.ok()).toBeTruthy()
    const hw = await hwRes.json()
    homeworkId = hw.id
  } finally {
    await teacherCtx.dispose()
    await studentCtx.dispose()
  }
})

test.afterAll(async () => {
  if (!homeworkId) return
  const teacherCtx = await request.newContext({ baseURL: BASE_URL })
  try {
    const signInRes = await teacherCtx.post('/api/auth/sign-in/email', { data: TEACHER })
    expect(signInRes.ok()).toBeTruthy()
    const deleteRes = await teacherCtx.delete(`/api/homework/${homeworkId}`)
    expect(deleteRes.ok()).toBeTruthy()
  } finally {
    await teacherCtx.dispose()
  }
})

async function loginAs(
  page: Page,
  credentials: { email: string; password: string },
  expectedUrlPattern: RegExp
) {
  await page.goto('/login')
  await page.getByPlaceholder('Sähköpostiosoite').fill(credentials.email)
  await page.getByPlaceholder('Salasana').fill(credentials.password)
  await page.getByRole('button', { name: /kirjaudu sisään/i }).click()
  await page.waitForURL(expectedUrlPattern)
  await markStartupAnnouncementsAsSeen(page, credentials.email)
}

// Set the homework comment HTML directly via the API (teacher auth)
async function setComment(comment: string) {
  const teacherCtx = await request.newContext({ baseURL: BASE_URL })
  try {
    const signInRes = await teacherCtx.post('/api/auth/sign-in/email', { data: TEACHER })
    expect(signInRes.ok()).toBeTruthy()
    const putRes = await teacherCtx.put(`/api/homework/${homeworkId}`, {
      data: { comment },
    })
    expect(putRes.ok()).toBeTruthy()
  } finally {
    await teacherCtx.dispose()
  }
}

test.describe.serial('Homework comment formatting', () => {
  test.beforeEach(async () => {
    // Reset the comment so each test starts from a clean slate
    await setComment('')
  })

  test('teacher saves formatted comment and student sees it as rendered HTML', async ({
    page,
    browser,
  }) => {
    // Teacher: add a formatted comment
    await loginAs(page, TEACHER, /\/teacher\//)
    await page.goto(`/teacher/students/${studentId}/homework/${homeworkId}/edit`)

    const editor = page.locator('.tiptap')
    await editor.waitFor()
    await editor.click()

    // Heading via keyboard shortcut
    await page.keyboard.press('Control+Alt+2')
    await page.keyboard.type('Harjoitteluohje', { delay: 25 })
    await expect(editor.locator('h2').filter({ hasText: 'Harjoitteluohje' })).toBeAttached()
    await page.keyboard.press('Enter')

    // Italic
    await page.keyboard.press('Control+i')
    await page.keyboard.type('Tärkeää:', { delay: 25 })
    await page.keyboard.press('Control+i')
    await expect(editor.locator('em').filter({ hasText: 'Tärkeää:' })).toBeAttached()
    await page.keyboard.press('Enter')

    // Bold
    await page.keyboard.press('Control+b')
    await page.keyboard.type('muista harjoitella', { delay: 25 })
    await page.keyboard.press('Control+b')
    await expect(editor.locator('strong').filter({ hasText: 'muista harjoitella' })).toBeAttached()
    await page.keyboard.press('Enter')

    // Bullet list — toolbar button activates list, double-Enter exits it without destroying it
    await page.getByTitle('Lista', { exact: true }).click()
    await editor.focus()
    await page.keyboard.type('Ohje yksi', { delay: 25 })
    await expect(editor.locator('ul li').filter({ hasText: 'Ohje yksi' })).toBeAttached()
    await page.keyboard.press('Enter')
    await page.keyboard.type('Ohje kaksi', { delay: 25 })
    await expect(editor.locator('ul li').filter({ hasText: 'Ohje kaksi' })).toBeAttached()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter')

    // Ordered list — same pattern
    await page.getByTitle('Numeroitu lista').click()
    await editor.focus()
    await page.keyboard.type('Vaihe yksi', { delay: 25 })
    await expect(editor.locator('ol li').filter({ hasText: 'Vaihe yksi' })).toBeAttached()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter')

    // Link
    await page.keyboard.type('nettisivu', { delay: 25 })
    await page.keyboard.press('Home')
    await page.keyboard.press('Shift+End')
    await page.getByTitle('Linkki').click()
    // Dialog has two inputs: display text (auto-focused) and URL (second)
    await page.locator('.inset-0 input').nth(1).fill('example.com')
    await page.getByRole('button', { name: 'Tallenna' }).click()
    await expect(editor.locator('a').filter({ hasText: 'nettisivu' })).toBeAttached()

    // Save homework
    await page.locator('button.rounded-full.bg-white').click()
    await page.waitForURL(`/teacher/students/${studentId}/homework`)

    // Student: verify all formatting is rendered as HTML elements
    const studentPage = await browser.newPage()
    await loginAs(studentPage, STUDENT, /\/student\//)
    await studentPage.goto('/student/homework/list')

    await expect(studentPage.getByText('Opettajan kommentti')).toBeVisible()

    // Heading
    await expect(studentPage.locator('h2').filter({ hasText: 'Harjoitteluohje' })).toBeVisible()

    // Italic
    await expect(studentPage.locator('em').filter({ hasText: 'Tärkeää:' })).toBeVisible()

    // Bold
    await expect(studentPage.locator('strong').filter({ hasText: 'muista harjoitella' })).toBeVisible()

    // Bullet list
    await expect(studentPage.locator('ul li').filter({ hasText: 'Ohje yksi' })).toBeVisible()
    await expect(studentPage.locator('ul li').filter({ hasText: 'Ohje kaksi' })).toBeVisible()

    // Ordered list
    await expect(studentPage.locator('ol li').filter({ hasText: 'Vaihe yksi' })).toBeVisible()

    // Link — href should be the full URL (TextEditor adds https:// if missing)
    await expect(
      studentPage.locator('a[href="https://example.com"]').filter({ hasText: 'nettisivu' })
    ).toBeVisible()

    // Raw HTML tags must not appear as visible text
    await expect(studentPage.getByText('<strong>')).not.toBeVisible()
    await expect(studentPage.getByText('<h2>')).not.toBeVisible()
    await expect(studentPage.getByText('<a href')).not.toBeVisible()

    await studentPage.close()
  })

  test('YouTube link is shown as an embed and non-YouTube link stays as a link', async ({
    browser,
  }) => {
    // YouTube IDs are fake but valid 11-char shapes
    await setComment(
      '<p><a href="https://www.youtube.com/watch?v=testVidId01">katso video</a></p>' +
        '<p><a href="https://example.com">nettisivu</a></p>'
    )

    const studentPage = await browser.newPage()
    await loginAs(studentPage, STUDENT, /\/student\//)
    await studentPage.goto('/student/homework/list')

    await expect(studentPage.getByText('Opettajan kommentti')).toBeVisible()

    // YouTube link rendered as iframe embed
    await expect(
      studentPage.locator('iframe[src*="youtube-nocookie.com/embed/testVidId01"]')
    ).toBeVisible()

    // YouTube anchor link should not be present
    await expect(studentPage.locator('a[href*="youtube.com"]')).not.toBeAttached()

    // Non-YouTube link still rendered as anchor
    await expect(
      studentPage.locator('a[href="https://example.com"]').filter({ hasText: 'nettisivu' })
    ).toBeVisible()

    await studentPage.close()
  })

  test('multiple YouTube links are each shown as separate embeds', async ({ browser }) => {
    // Covers youtube.com/watch and youtu.be link formats
    await setComment(
      '<p><a href="https://www.youtube.com/watch?v=testVidId01">video yksi</a></p>' +
        '<p><a href="https://youtu.be/testVidId02">video kaksi</a></p>'
    )

    const studentPage = await browser.newPage()
    await loginAs(studentPage, STUDENT, /\/student\//)
    await studentPage.goto('/student/homework/list')

    await expect(
      studentPage.locator('iframe[src*="youtube-nocookie.com/embed/testVidId01"]')
    ).toBeVisible()
    await expect(
      studentPage.locator('iframe[src*="youtube-nocookie.com/embed/testVidId02"]')
    ).toBeVisible()

    await studentPage.close()
  })
})
