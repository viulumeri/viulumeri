import { test, expect } from '@playwright/test'

test('login page is accessible', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('button', { name: /kirjaudu sisään/i })).toBeVisible()
})
