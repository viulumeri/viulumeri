import { test, expect } from '@playwright/test'

const TEACHER = { email: 'e2e-teacher@example.com', password: 'E2eTeacher123!' }
const BASE_URL = process.env.BASE_URL || process.env.E2E_UI_URL || 'http://localhost:3001'

test.describe('Homework creation flow', () => {
	test('teacher header preserves student name through create/select flow', async ({ page }) => {
		// Login as seeded teacher
		await page.goto(`${BASE_URL}/login`)
		await page.getByPlaceholder('Sähköpostiosoite').fill(TEACHER.email)
		await page.getByPlaceholder('Salasana').fill(TEACHER.password)

		const signInResponsePromise = page.waitForResponse(resp =>
			resp.url().includes('/api/auth/sign-in/email') && resp.request().method() === 'POST'
		)

		await page.getByRole('button', { name: /kirjaudu sisään/i }).click()
		const signInResponse = await signInResponsePromise
		expect(signInResponse.ok()).toBeTruthy()

		// Go to students list and open the first student card
		await page.goto(`${BASE_URL}/teacher/students`)
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

		// On select songs page: pick the first selectable song
		await page.waitForURL(/select-songs/)
		await page.locator('ul li button').first().click()

		// Confirm selection using the floating action button (button with svg)
		await page.locator('button:has(svg)').last().click()

		// Back on create page: the student's name should still be visible
		await expect(page.locator('header')).toContainText('E2E')
	})
})
