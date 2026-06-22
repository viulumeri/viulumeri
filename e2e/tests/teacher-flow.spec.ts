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

test('teacher flow', async ({ page }) => {
  test.setTimeout(120_000)

  const teacherCtx = await request.newContext({ baseURL: BASE_URL })
  const studentCtx = await request.newContext({ baseURL: BASE_URL })
  const today = new Date()
  const expectedDateText = today.toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: 'Europe/Helsinki'
  })
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

    // 1. Teacher logs in
    await loginAs(page, TEACHER, /\/teacher\//)

    // Verify that teacher sees install prompt
    await expect(page.getByText('Sovelluksen asennus')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Voit asentaa sovelluksen laitteellesi ja käyttää sitä kuin tavallista sovellusta')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Nämä ohjeet löytyvät myös asetuksista')).toBeVisible({ timeout: 15_000 })
    
    // Verify that image shows
    await expect(page.getByAltText('Asennusilmoitus')).toBeVisible()
    await expect(page.getByAltText('Aloitusnäyttöön lisäys')).toBeVisible()
    await expect(page.getByAltText('Valitse install')).toBeVisible()

    // Dismiss the prompt and verify it doesn't reappear
    await page.getByRole('button', { name: 'OK' }).click()
    await expect(page.getByText('Sovelluksen asennus')).toBeHidden()
    await page.reload()
    await expect(page.getByText('Sovelluksen asennus')).toBeHidden()

    // 2. Teacher creates an invite link
    await page.goto('/invite')
    const inviteResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/api/invites') && response.request().method() === 'POST'
    )
    await page.getByRole('button', { name: 'Luo kutsulinkki' }).click()
    const inviteResponse = await inviteResponsePromise
    expect(inviteResponse.ok()).toBeTruthy()
    const { inviteUrl } = await inviteResponse.json()
    const token = inviteUrl.split('/invite/')[1]
    await expect(page.locator('input[readonly]')).toBeVisible({ timeout: 15_000 })

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
    await page.goto(`/teacher/students/${studentId}/homework/create`)
    const createHwResponsePromise = page.waitForResponse(
      response =>
        response.url().includes('/api/homework') && response.request().method() === 'POST'
    )
    await page.locator('button.rounded-full.bg-white').click()
    const createHwResponse = await createHwResponsePromise
    expect(createHwResponse.ok()).toBeTruthy()
    const hw = await createHwResponse.json()
    homeworkId = hw.id
    await page.waitForURL(`/teacher/students/${studentId}/homework`)
    await expect(page.getByText(expectedDateText).first()).toBeVisible({ timeout: 15_000 })

    // 6. Teacher creates a second homework via API to enable carousel navigation
    const createHw2Res = await teacherCtx.post('/api/homework', {
      data: { studentId, songs: [], comment: '' }
    })
    expect(createHw2Res.ok()).toBeTruthy()
    const hw2 = await createHw2Res.json()
    hw2Id = hw2.id

    // 7. Carousel navigation: arrows and dot indicator appear with 2 homeworks
    await page.goto(`/teacher/students/${studentId}/homework`)
    await expect(page.getByText(expectedDateText).first()).toBeVisible({ timeout: 15_000 })

    const leftArrow = page.getByRole('button', { name: 'Edellinen kotitehtävä' })
    const rightArrow = page.getByRole('button', { name: 'Seuraava kotitehtävä' })

    await expect(leftArrow).toBeVisible()
    await expect(rightArrow).toBeVisible()

    // Newest homework is shown first — right arrow should be disabled
    await expect(rightArrow).toBeDisabled()
    await expect(leftArrow).not.toBeDisabled()

    // Dot indicator is visible
    await expect(page.getByRole('button', { name: 'Kotitehtävä 1' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Kotitehtävä 2' })).toBeVisible()

    // Navigate to previous homework — left arrow becomes disabled
    await leftArrow.click()
    await expect(leftArrow).toBeDisabled()
    await expect(rightArrow).not.toBeDisabled()

    // Clean up second homework
    const deleteHw2Res = await teacherCtx.delete(`/api/homework/${hw2.id}`)
    expect(deleteHw2Res.ok()).toBeTruthy()

    // 8. Teacher writes a rich-text comment using the TipTap editor
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
    await editor.locator('ul li').first().click()
    await page.keyboard.type('Ohje yksi', { delay: 25 })
    await expect(editor.locator('ul li').filter({ hasText: 'Ohje yksi' })).toBeAttached()
    await page.keyboard.press('Enter')
    await page.keyboard.type('Ohje kaksi', { delay: 25 })
    await expect(editor.locator('ul li').filter({ hasText: 'Ohje kaksi' })).toBeAttached()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter')

    // Ordered list — same pattern
    await page.getByTitle('Numeroitu lista').click()
    await editor.locator('ol li').first().click()
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

    // Save homework and verify navigation back to homework list
    await page.locator('button.rounded-full.bg-white').click()
    await page.waitForURL(`/teacher/students/${studentId}/homework`)

    // 9. Teacher edits the homework comment
    await page.goto(`/teacher/students/${studentId}/homework/${homeworkId}/edit`)

    const editEditor = page.locator('.tiptap')
    await editEditor.waitFor()
    await editEditor.click()

    // Select all existing content and replace with updated comment
    await page.keyboard.press('Control+a')
    await page.keyboard.type('Päivitetty kommentti', { delay: 25 })
    await expect(editEditor.getByText('Päivitetty kommentti')).toBeAttached()

    const saveEditResponsePromise = page.waitForResponse(
      response =>
        response.url().includes(`/api/homework/${homeworkId}`) &&
        response.request().method() === 'PUT'
    )
    await page.locator('button.rounded-full.bg-white').click()
    const saveEditResponse = await saveEditResponsePromise
    expect(saveEditResponse.ok()).toBeTruthy()
    await page.waitForURL(`/teacher/students/${studentId}/homework`)

    // 10. Teacher deletes the student
    await page.goto('/settings')

    await page.getByRole('button', { name: 'Oppilaiden hallinta' }).click()

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

    // 11. Teacher logs out
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
