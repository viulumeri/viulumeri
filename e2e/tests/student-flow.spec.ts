import { test, expect, request, type Page } from '@playwright/test'
import { markStartupAnnouncementsAsSeen } from './announcement-state'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'
const TEACHER = { email: 'e2e-teacher@example.com', password: 'E2eTeacher123!' }
const STUDENT = { email: 'e2e-student@example.com', password: 'E2eStudent123!' }

async function loginAs(
  page: Page,
  credentials: { email: string; password: string },
  expectedUrlPattern: RegExp
) {
  await page.goto('/login')
  await page.getByPlaceholder('Sähköpostiosoite').fill(credentials.email)
  await page.getByPlaceholder('Salasana').fill(credentials.password)

  const signInResponsePromise = page.waitForResponse(
    response =>
      response.url().includes('/api/auth/sign-in/email') &&
      response.request().method() === 'POST'
  )

  await page.getByRole('button', { name: /kirjaudu sisään/i }).click()

  const signInResponse = await signInResponsePromise
  expect(signInResponse.ok(), `Sign-in failed: HTTP ${signInResponse.status()}`).toBe(true)

  await page.waitForURL(expectedUrlPattern, { timeout: 15_000 })
  await markStartupAnnouncementsAsSeen(page, credentials.email)
}

test('student flow', async ({ page }) => {
  test.setTimeout(120_000)

  const studentCtx = await request.newContext({ baseURL: BASE_URL })
  const teacherCtx = await request.newContext({ baseURL: BASE_URL })
  let studentId: string | undefined
  let homeworkId: string | undefined
  let hw2Id: string | undefined

  try {
    // Sign in via API to set up state
    const teacherSignIn = await teacherCtx.post('/api/auth/sign-in/email', { data: TEACHER })
    expect(teacherSignIn.ok()).toBeTruthy()

    const studentSignIn = await studentCtx.post('/api/auth/sign-in/email', { data: STUDENT })
    expect(studentSignIn.ok()).toBeTruthy()

    // Clean up any previous teacher–student relationships
    const existingStudentsRes = await teacherCtx.get('/api/students')
    expect(existingStudentsRes.ok()).toBeTruthy()
    const { students: existingStudents } = await existingStudentsRes.json()
    const existingStudent = existingStudents.find(
      (s: { id: string; name: string }) => s.name === 'E2E Student'
    )
    if (existingStudent) {
      const unlinkRes = await teacherCtx.delete(`/api/students/${existingStudent.id}`)
      expect(unlinkRes.ok()).toBeTruthy()
    }

    // 1. Student logs in
    await loginAs(page, STUDENT, /\/student\//)

    // 2. Dismiss install prompt
    await page.getByRole('button', { name: 'OK' }).click()
    await expect(page.getByText('Sovelluksen asennus')).toBeHidden()

    // 3. Student sees empty starter page
    const practiceBox = page.getByText('Harjoituskerrat', { exact: true }).locator('xpath=..')
    await expect(practiceBox.getByText('0', { exact: true })).toBeVisible()
    const teacherBox = page.getByText('Opettaja', { exact: true }).locator('xpath=..')
    await expect(teacherBox.getByText('–', { exact: true })).toBeVisible()
    const playedBox = page.getByText('Soitetut kappaleet', { exact: true }).locator('xpath=..')
    await expect(playedBox.getByText('0', { exact: true })).toBeVisible()



  } finally {
    // Clean up homework if student deletion didn't cascade
    if (homeworkId) {
      await teacherCtx.post('/api/auth/sign-in/email', { data: TEACHER })
      await teacherCtx.delete(`/api/homework/${homeworkId}`)
    }
    // Clean up second homework if test failed before inline cleanup
    if (hw2Id) {
      await teacherCtx.delete(`/api/homework/${hw2Id}`)
    }
    // Clean up student relationship if test failed before deletion
    if (studentId) {
      await teacherCtx.delete(`/api/students/${studentId}`)
    }
    await teacherCtx.dispose()
    await studentCtx.dispose()
  }
})
