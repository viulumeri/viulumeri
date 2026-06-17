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
    // Clean up any previous homework assigned to the student
    const existingHomeworkRes = await studentCtx.get('/api/homework')
    expect(existingHomeworkRes.ok()).toBeTruthy()

    const { homework: existingHomework } = await existingHomeworkRes.json()

    for (const hw of existingHomework) {
      const deleteHomeworkRes = await teacherCtx.delete(`/api/homework/${hw.id}`)
      expect(deleteHomeworkRes.ok()).toBeTruthy()
    }

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

    // Student dismisses install prompt
    if (await page.getByText('Sovelluksen asennus').isVisible()) {
      await page.getByRole('button', { name: 'OK' }).click()
      await expect(page.getByText('Sovelluksen asennus')).toBeHidden()
    }

    // Student sees empty starter page
    const practiceBox = page.getByText('Harjoituskerrat', { exact: true }).locator('xpath=..')
    await expect(practiceBox.getByText('0', { exact: true })).toBeVisible()
    const teacherBox = page.getByText('Opettaja', { exact: true }).locator('xpath=..')
    await expect(teacherBox.getByText('–', { exact: true })).toBeVisible()
    const playedBox = page.getByText('Soitetut kappaleet', { exact: true }).locator('xpath=..')
    await expect(playedBox.getByText('0', { exact: true })).toBeVisible()

    // 4. Generate teacher invite link
    const inviteRes = await teacherCtx.post('/api/invites')
    expect(inviteRes.ok()).toBeTruthy()

    const { inviteUrl } = await inviteRes.json()
    const token = inviteUrl.split('/invite/')[1]
    expect(token).toBeTruthy()

    // 5. Student accepts invite and sees teacher info
    await page.goto(`/invite/${token}`)

    await expect(page.getByText('Kutsu oppilaaksi')).toBeVisible()
    await expect(page.getByText('Opettaja:')).toBeVisible()
    await expect(page.getByText('E2E Teacher')).toBeVisible()

    const acceptInviteResponsePromise = page.waitForResponse(
    response =>
        response.url().includes('/api/invites/') &&
        response.url().includes('/accept') &&
        response.request().method() === 'POST'
    )


    await page.getByRole('button', { name: 'Vahvista' }).click()

    const acceptInviteResponse = await acceptInviteResponsePromise
    expect(acceptInviteResponse.ok()).toBeTruthy()

    await page.waitForURL(/\/student\//)

    await expect(teacherBox.getByText('E2E', { exact: true })).toBeVisible()

    // 6. Student opens homework list and sees no homework
    const startButton = page.getByRole('button', { name: 'Aloita' })

    await startButton.click()
    await expect(page.getByText('Tehtävälista on tyhjä')).toBeVisible()

    // 7. Fetch student ID and generate homework for student
    const studentsRes = await teacherCtx.get('/api/students')
    expect(studentsRes.ok()).toBeTruthy()
    const { students } = await studentsRes.json()
    const student = students.find((s: { id: string; name: string }) => s.name === 'E2E Student')
    expect(student).toBeDefined()
    studentId = student.id

    const homeworkRes = await teacherCtx.post('/api/homework', {
      data: { studentId, songs: ['000-tästä-se-alkaa'], comment: 'Soita tämä' }
    })
    expect(homeworkRes.ok()).toBeTruthy()
    const homework = await homeworkRes.json()
    homeworkId = homework.id

    // 8. Student sees new homework in list
    await page.reload()
    await expect(page.getByText('Tästä se alkaa')).toBeVisible({ timeout: 15_000 })

    // 9. Student presses "Harjoittelin" button and sees practice count update
    const practiced = page.getByRole('button', { name: 'Harjoittelin' })
    await practiced.click()
    await expect(practiceBox.getByText('1', { exact: true })).toBeVisible()

    // 10. Generate second homework and student sees reset practice count
    const hw2Res = await teacherCtx.post('/api/homework', {
      data: { studentId, songs: ['001-hyppyhiiri'], comment: 'Soita tämäkin' }
    })
    expect(hw2Res.ok()).toBeTruthy()
    const hw2 = await hw2Res.json()
    hw2Id = hw2.id

    await page.reload()

    // 11. Student sees both homework items and sees updated practice count
    await expect(practiceBox.getByText('0', { exact: true })).toBeVisible()

    const leftArrow = page.getByRole('button', { name: 'Edellinen kotitehtävä' })
    const rightArrow = page.getByRole('button', { name: 'Seuraava kotitehtävä' })

    await startButton.click()
    await expect(page.getByText('Hyppyhiiri')).toBeVisible()
    await leftArrow.click()
    await expect(page.getByText('Tästä se alkaa')).toBeVisible()
    await rightArrow.click()
    await practiced.click()
    await expect(practiceBox.getByText('1', { exact: true })).toBeVisible()

    // 12. Delete the practiced homework so its practice count is cleaned up
    const deleteHomeworkResponse = await teacherCtx.delete(`/api/homework/${hw2Id}`)
    expect(deleteHomeworkResponse.ok()).toBeTruthy()
    hw2Id = undefined

    await page.goto('/student/homework/list')
    await expect(page.getByText('Hyppyhiiri')).toBeHidden({ timeout: 15_000 })
    await expect(page.getByText('Tästä se alkaa')).toBeVisible({ timeout: 15_000 })

    // 13. Student removes teacher and still sees homework
    await page.goto('/settings')
    await expect(page.getByText('Nykyinen opettaja:')).toBeVisible()
    await expect(page.getByText('E2E Teacher')).toBeVisible()

    const removeTeacherResponsePromise = page.waitForResponse(
      response =>
        response.url().endsWith('/api/teacher') &&
        response.request().method() === 'DELETE'
    )
    page.once('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: 'Poista opettaja' }).click()
    const removeTeacherResponse = await removeTeacherResponsePromise
    expect(removeTeacherResponse.ok()).toBeTruthy()
    studentId = undefined

    await expect(page.getByText('Ei opettajaa')).toBeVisible({ timeout: 15_000 })
    await page.goto('/student/homework/list')
    await expect(page.getByText('Tästä se alkaa')).toBeVisible({ timeout: 15_000 })

    // 14. Student logs out
    await page.goto('/settings')
    await page.getByRole('button', { name: /kirjaudu ulos/i }).click()
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })

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
