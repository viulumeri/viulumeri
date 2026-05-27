import { test, expect } from '@playwright/test'
import { SEED_USERS } from '../global-setup'

const dismissNotificationIfVisible = async (page: any) => {
  const closeButton = page.getByRole('button', { name: /sulje ilmoitus/i })
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click()
  }
}

const teacher = (() => {
  const found = SEED_USERS.find(user => user.userType === 'teacher')
  if (!found) {
    throw new Error('No seeded teacher user found in SEED_USERS')
  }
  return found
})()

test.describe('Homework creation flow', () => {
  test('teacher header preserves student name through create/select flow', async ({ page }) => {
    // Login as seeded teacher
    await page.goto('/login')
    await page.getByPlaceholder('Sähköpostiosoite').fill(teacher.email)
    await page.getByPlaceholder('Salasana').fill(teacher.password)

    const signInResponsePromise = page.waitForResponse(resp =>
      resp.url().includes('/api/auth/sign-in/email') && resp.request().method() === 'POST'
    )

    await page.getByRole('button', { name: /kirjaudu sisään/i }).click()
    const signInResponse = await signInResponsePromise
    expect(signInResponse.ok()).toBeTruthy()
    await page.waitForURL(/\/teacher\//)
    await dismissNotificationIfVisible(page)

    // Go to students list and open the first student card
    await page.goto('/teacher/students')
    const studentLink = page.locator('main').locator('a').first()
    await expect(studentLink).toBeVisible()
    await studentLink.click()

    // Header should show the first name (E2E)
    await expect(page.locator('header')).toContainText('E2E')

    // Click the create homework FAB
    await page.locator('a[href*="/homework/create"]').first().click()

    // Still should show the student's name in the header
    await expect(page.locator('header')).toContainText('E2E')

    // Click "Lisää uusi kappale" to go to the song picker
    await page.getByRole('button', { name: /Lisää uusi kappale/i }).click()

    // The song picker should open
    await page.waitForURL(/select-songs/)
    await expect(page.getByRole('heading', { name: /Valitse kappaleita/i })).toBeVisible()
  })
})
