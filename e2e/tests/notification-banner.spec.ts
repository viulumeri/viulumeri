import { test, expect } from '@playwright/test'

test.describe('NotificationBanner', () => {
  test('error notification flow', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('Sähköpostiosoite').fill('test@example.com')
    await page.getByPlaceholder('Salasana').fill('incorrectpassword')
    await page.getByRole('button', { name: /kirjaudu sisään/i }).click()

    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText('Virheellinen sähköposti tai salasana')

    await page.getByRole('button', { name: /sulje ilmoitus/i }).click()
    await expect(alert).not.toBeVisible()
  })

  test('success notification flow', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByPlaceholder('Sähköpostiosoite').fill('test@example.com')
    await page.getByRole('button', { name: /lähetä/i }).click()

    const notification = page.getByText('Palautuslinkki lähetetty sähköpostiin')
    await expect(notification).toBeVisible()
    await expect(notification).not.toBeVisible({ timeout: 7000 })
  })
})
