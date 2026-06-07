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
  await markStartupAnnouncementsAsSeen(page, credentials.email)
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
}

test('teacher flow', async ({ page }) => {
  test.setTimeout(60_000)

  const teacherCtx = await request.newContext({ baseURL: BASE_URL })
  const studentCtx = await request.newContext({ baseURL: BASE_URL })
  let studentId: string | undefined
  let homeworkId: string | undefined

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

    // 1. Teacher logs in
    await loginAs(page, TEACHER, /\/teacher\//)

    // 2. Teacher creates an invite link
    const inviteRes = await teacherCtx.post('/api/invites')
    expect(inviteRes.ok()).toBeTruthy()
    const { inviteUrl } = await inviteRes.json()
    const token = inviteUrl.split('/invite/')[1]

    // 3. Student accepts the invite
    const acceptRes = await studentCtx.post(`/api/invites/${token}/accept`)
    expect(acceptRes.ok()).toBeTruthy()

    // 4. Teacher sees the student in the students view
    await page.goto('/teacher/students')
    await expect(page.getByText(/E2E\s*Student/)).toBeVisible({ timeout: 15_000 })

    const studentsRes = await teacherCtx.get('/api/students')
    expect(studentsRes.ok()).toBeTruthy()
    const { students } = await studentsRes.json()
    const student = students.find((s: { id: string; name: string }) => s.name === 'E2E Student')
    expect(student).toBeDefined()
    studentId = student.id

    // 5. Teacher creates homework for the student
    const hwRes = await teacherCtx.post('/api/homework', {
      data: { studentId, songs: [], comment: '' },
    })
    expect(hwRes.ok()).toBeTruthy()
    const hw = await hwRes.json()
    homeworkId = hw.id

    await page.goto(`/teacher/students/${studentId}/homework`)
    await expect(page.getByRole('heading', { name: 'Tehtävä', exact: true })).toBeVisible({ timeout: 15_000 })

    // 6. Teacher deletes the student
    await page.goto('/settings')

    const deleteStudentResponsePromise = page.waitForResponse(
      response =>
        response.url().includes(`/api/students/${studentId}`) &&
        response.request().method() === 'DELETE'
    )
    page.once('dialog', dialog => dialog.accept())
    await page.getByText('E2E Student').locator('..').getByRole('button', { name: 'Poista' }).click()
    const deleteStudentResponse = await deleteStudentResponsePromise
    expect(deleteStudentResponse.ok()).toBeTruthy()
    studentId = undefined

    await expect(page.getByText('Oppilas poistettu onnistuneesti')).toBeVisible({ timeout: 15_000 })

    // 7. Teacher logs out
    await page.goto('/settings')
    await page.getByRole('button', { name: /kirjaudu ulos/i }).click()
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
  } finally {
    // Clean up homework if student deletion didn't cascade
    if (homeworkId) {
      await teacherCtx.post('/api/auth/sign-in/email', { data: TEACHER })
      await teacherCtx.delete(`/api/homework/${homeworkId}`)
    }
    // Clean up student relationship if test failed before deletion
    if (studentId) {
      await teacherCtx.delete(`/api/students/${studentId}`)
    }
    await teacherCtx.dispose()
    await studentCtx.dispose()
  }
})
