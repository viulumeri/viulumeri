import { test, expect, type Page } from '@playwright/test'
import { markInstallPromptAsSeen, markStartupAnnouncementsAsSeen } from './announcement-state'

const ADMIN = {
  email: 'e2e-admin@example.com',
  password: 'E2eAdmin123!'
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')

  await markStartupAnnouncementsAsSeen(page, email)
  await markInstallPromptAsSeen(page)

  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)

  const signInResponsePromise = page.waitForResponse(response => {
    return (
      response.url().includes('/api/auth/sign-in/email') &&
      response.request().method() === 'POST'
    )
  })

  await page.locator('form button[type="submit"]').click()

  const signInResponse = await signInResponsePromise
  expect(signInResponse.ok()).toBe(true)

  await page.waitForURL(url => !url.pathname.endsWith('/login'), {
    timeout: 15_000
  })
}

test.describe('Admin FAQ page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/faqs**', async route => {
      const method = route.request().method()

      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        })
      }

      if (method === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ _id: 'faq-1' })
        })
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true })
      })
    })

    await login(page, ADMIN.email, ADMIN.password)
    await page.goto('/admin/faq')
    console.log('URL:', page.url())
    await page.screenshot({ path: 'debug-faq-page.png', fullPage: true })
  })

  test('admin can open create FAQ form and add text blocks', async ({ page }) => {

    await page.getByPlaceholder('Kirjoita kysymys').fill('Miten palvelu toimii?')

    await page.getByRole('button', { name: /lisää tekstiosio/i }).click()

    await page
      .getByPlaceholder('Kirjoita tekstiosion sisältö')
      .fill('Palvelu toimii näin.')

    await page.getByRole('button', { name: /^Lisää kysymys$/i }).click()

    await expect(page.getByPlaceholder('Kirjoita kysymys')).toHaveValue('')
  })

  test('admin can add and remove answer sections', async ({ page }) => {

    await page.getByRole('button', { name: /lisää tekstiosio/i }).click()
    await page.getByRole('button', { name: /lisää kuvaosio/i }).click()

    await expect(page.getByText('Tekstiosio 1')).toBeVisible()
    await expect(page.getByText('Kuvaosio 2')).toBeVisible()

    await page.getByRole('button', { name: /poista osio/i }).first().click()

    await expect(page.getByText('Tekstiosio 1')).not.toBeVisible()
    await expect(page.getByText('Kuvaosio 1')).toBeVisible()
  })

  test('admin can reorder FAQ blocks', async ({ page }) => {

    await page.getByRole('button', { name: /lisää tekstiosio/i }).click()
    await page.getByRole('button', { name: /lisää tekstiosio/i }).click()

    const blocks = page.getByPlaceholder('Kirjoita tekstiosion sisältö')

    await blocks.nth(0).fill('Ensimmäinen osio')
    await blocks.nth(1).fill('Toinen osio')

    await page.getByRole('button', { name: '↑' }).last().click()

    await expect(blocks.nth(0)).toHaveValue('Toinen osio')
    await expect(blocks.nth(1)).toHaveValue('Ensimmäinen osio')
  })

test('admin can see FAQ browse section', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: /selaa ja muokkaa kysymyksiä/i })
  ).toBeVisible()
})

  test('admin can cancel creating FAQ', async ({ page }) => {

    await page.getByPlaceholder('Kirjoita kysymys').fill('Peruttava kysymys')
    await page.getByRole('button', { name: /lisää tekstiosio/i }).click()

    await page.getByRole('button', { name: /^Peruuta$/i }).click()

    await expect(page.getByPlaceholder('Kirjoita kysymys')).toHaveValue('')
    await expect(page.getByText('Tekstiosio 1')).not.toBeVisible()
  })
})