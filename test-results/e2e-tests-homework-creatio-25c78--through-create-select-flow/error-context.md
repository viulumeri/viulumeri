# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/tests/homework-creation.spec.ts >> Homework creation flow >> teacher header preserves student name through create/select flow
- Location: e2e/tests/homework-creation.spec.ts:7:6

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - alert [ref=e3]:
    - generic [ref=e4]:
      - img [ref=e5]
      - generic [ref=e7]: Kirjautuminen epäonnistui
    - button "Sulje ilmoitus" [ref=e8]: ×
  - generic [ref=e12]:
    - banner [ref=e14]:
      - heading "Viulumeri" [level=1] [ref=e15]
    - generic [ref=e20]:
      - generic [ref=e21]:
        - textbox "Sähköpostiosoite" [ref=e23]: e2e-teacher@example.com
        - textbox "Salasana" [ref=e25]
        - button "Kirjaudu sisään" [ref=e26]
      - generic [ref=e27]:
        - link "Unohdin salasanani" [ref=e28] [cursor=pointer]:
          - /url: /forgot-password
        - link "Luo uusi käyttäjä" [ref=e29] [cursor=pointer]:
          - /url: /signup
```

# Test source

```ts
  1  | import { test, expect, type Page } from '@playwright/test'
  2  | import { SEED_USERS } from '../global-setup'
  3  | 
  4  | const TEACHER = { email: 'e2e-teacher@example.com', password: 'E2eTeacher123!' }
  5  | 
  6  | test.describe('Homework creation flow', () => {
  7  | 	test('teacher header preserves student name through create/select flow', async ({ page }) => {
  8  | 		// Login as seeded teacher
  9  | 		const UI_URL = process.env.E2E_UI_URL || 'http://localhost:5173'
  10 | 		await page.goto(`${UI_URL}/login`)
  11 | 		await page.getByPlaceholder('Sähköpostiosoite').fill(TEACHER.email)
  12 | 		await page.getByPlaceholder('Salasana').fill(TEACHER.password)
  13 | 
  14 | 		const signInResponsePromise = page.waitForResponse(resp =>
  15 | 			resp.url().includes('/api/auth/sign-in/email') && resp.request().method() === 'POST'
  16 | 		)
  17 | 
  18 | 		await page.getByRole('button', { name: /kirjaudu sisään/i }).click()
  19 | 		const signInResponse = await signInResponsePromise
> 20 | 		expect(signInResponse.ok()).toBeTruthy()
     |                               ^ Error: expect(received).toBeTruthy()
  21 | 
  22 | 		// Go to students list and open a student
  23 | 		await page.goto(`${UI_URL}/teacher/students`)
  24 | 		// Click the seeded student card (name from global-setup is "E2E Student")
  25 | 		const studentLink = page.locator('a').filter({ hasText: 'E2E Student' }).first()
  26 | 		await expect(studentLink).toBeVisible()
  27 | 		await studentLink.click()
  28 | 
  29 | 		// Header should show the first name (E2E)
  30 | 		await expect(page.locator('header')).toContainText('E2E')
  31 | 
  32 | 		// Click the create homework FAB
  33 | 		await page.locator('a[href*="/homework/create"]').first().click()
  34 | 
  35 | 		// Still should show the student's name in the header
  36 | 		await expect(page.locator('header')).toContainText('E2E')
  37 | 
  38 | 		// Click "Lisää uusi kappale" to go to the song picker
  39 | 		await page.getByRole('button', { name: /Lisää uusi kappale/i }).click()
  40 | 
  41 | 		// On select songs page: pick the first selectable song
  42 | 		await page.waitForURL(/select-songs/)
  43 | 		await page.locator('ul li button').first().click()
  44 | 
  45 | 		// Confirm selection using the floating action button (button with svg)
  46 | 		await page.locator('button:has(svg)').last().click()
  47 | 
  48 | 		// Back on create page: the student's name should still be visible
  49 | 		await expect(page.locator('header')).toContainText('E2E')
  50 | 	})
  51 | })
  52 | 
```