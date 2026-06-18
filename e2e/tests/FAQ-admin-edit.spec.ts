import { test, expect, type Page } from '@playwright/test'
import { SEED_USERS } from '../global-setup'
import { markStartupAnnouncementsAsSeen } from './announcement-state'

const adminUser = SEED_USERS.find(user => user.userType === 'admin')

if (!adminUser) {
  throw new Error('No seeded admin user found in SEED_USERS')
}

const ADMIN = adminUser

const closeNotificationsIfOpen = async (page: Page) => {
  const dialog = page.getByRole('dialog', { name: 'Ilmoitukset' })
  const okButton = dialog.getByRole('button', { name: 'OK' })

  try {
    await expect(dialog).toBeVisible({ timeout: 3000 })
    await okButton.click()
    await expect(dialog).toBeHidden()
  } catch {}
}

async function loginAsAdmin(page: Page) {
  await page.goto('/login')
  await page.getByPlaceholder('Sähköpostiosoite').fill(ADMIN.email)
  await page.getByPlaceholder('Salasana').fill(ADMIN.password)
  await page.getByRole('button', { name: 'Kirjaudu sisään' }).click()
  await page.waitForURL(url => !url.pathname.endsWith('/login'), { timeout: 15_000 })

  await markStartupAnnouncementsAsSeen(page, ADMIN.email)
  await page.goto('/admin')
  await expect(page).toHaveURL('/admin')
}

const todayText = () => {
  const today = new Date()
  return `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear()}`
}

async function openAddFaq(page: Page) {
  await page.getByRole('button', { name: 'Lisää uusi kysymys' }).click()
  await expect(page.getByPlaceholder('Kirjoita kysymys')).toBeVisible()
}

async function createFaqWithTextBlock(page: Page, question: string, answer: string) {
  await openAddFaq(page)

  await page.getByPlaceholder('Kirjoita kysymys').fill(question)
  await page.getByRole('button', { name: 'Lisää tekstiosio' }).click()
  await page.getByPlaceholder('Kirjoita tekstiosion sisältö').fill(answer)

  await page.getByRole('button', { name: 'Lisää kysymys' }).click()
}

async function openFaqInAdmin(page: Page, question: string) {
  await page.getByRole('button', { name: 'Selaa ja muokkaa kysymyksiä' }).click()
  await expect(page.getByText(question)).toBeVisible()
  await page.getByRole('button', { name: question }).click()
}

async function openFaqInSettings(page: Page, question: string) {
  await page.goto('/settings')
  await closeNotificationsIfOpen(page)

  await page.getByRole('button', { name: /Usein kysytyt kysymykset/ }).click()
  await expect(page.getByText(question)).toBeVisible()
  await page.getByRole('button', { name: question }).click()
}

test('Admin can add questions for FAQ', async ({ page }) => {
  await loginAsAdmin(page)

  const question = `Uusi lisätty kysymys / lisäys ${Date.now()}`
  const answer = `Uuden lisätyn kysymyksen vastaus / lisäys ${Date.now()}`
  const formattedDate = todayText()

  await createFaqWithTextBlock(page, question, answer)

  await openFaqInAdmin(page, question)
  await expect(page.getByText(answer)).toBeVisible()
  await expect(page.getByText(`Lisätty: ${formattedDate}`)).toBeVisible()

  await openFaqInSettings(page, question)
  await expect(page.getByText(answer)).toBeVisible()
  await expect(page.getByText(`Lisätty: ${formattedDate}`)).toBeVisible()
})

test('Admin can remove questions from FAQ', async ({ page }) => {
  await loginAsAdmin(page)

  const question = `Uusi lisätty kysymys / poisto ${Date.now()}`
  const answer = `Uuden lisätyn kysymyksen vastaus / poisto ${Date.now()}`

  await createFaqWithTextBlock(page, question, answer)

  await openFaqInAdmin(page, question)
  await expect(page.getByText(answer)).toBeVisible()

  await page.getByRole('button', { name: 'Poista' }).click()
  await expect(page.getByText(question)).not.toBeVisible()

  await page.goto('/settings')
  await closeNotificationsIfOpen(page)

  await page.getByRole('button', { name: /Usein kysytyt kysymykset/ }).click()
  await expect(page.getByText(question)).not.toBeAttached()
})

test('Admin can edit questions in FAQ', async ({ page }) => {
  await loginAsAdmin(page)

  const question = `Uusi lisätty kysymys / muokkaus ${Date.now()}`
  const answer = `Uuden lisätyn kysymyksen vastaus / muokkaus ${Date.now()}`
  const editedQuestion = `Muokattu kysymys ${Date.now()}`
  const editedAnswer = `Muokattu vastaus ${Date.now()}`
  const formattedDate = todayText()

  await createFaqWithTextBlock(page, question, answer)
  await openFaqInAdmin(page, question)

  await page.getByRole('button', { name: 'Muokkaa', exact: true }).click()

  await page.locator('input:visible').last().fill(editedQuestion)
  await page.locator('textarea:visible').last().fill(editedAnswer)

  await expect(page.locator('textarea:visible').last()).toHaveValue(editedAnswer)

  await page.getByRole('button', { name: 'Tallenna', exact: true }).click()

  await page.reload()
  await closeNotificationsIfOpen(page)

  await openFaqInAdmin(page, editedQuestion)

  await expect(page.getByText(editedAnswer)).toBeVisible()
  await expect(page.getByText(`Päivitetty: ${formattedDate}`)).toBeVisible()
  await expect(page.getByText(question)).not.toBeAttached()
  await expect(page.getByText(answer)).not.toBeAttached()

  await openFaqInSettings(page, editedQuestion)

  await expect(page.getByText(editedAnswer)).toBeVisible()
  await expect(page.getByText(`Päivitetty: ${formattedDate}`)).toBeVisible()
  await expect(page.getByText(question)).not.toBeAttached()
  await expect(page.getByText(answer)).not.toBeAttached()
})

test('Admin can reorder FAQ text blocks', async ({ page }) => {
  await loginAsAdmin(page)

  const question = `Uusi lisätty kysymys / järjestys ${Date.now()}`
  const firstBlock = `Ensimmäinen tekstiosio ${Date.now()}`
  const secondBlock = `Toinen tekstiosio ${Date.now()}`

  await openAddFaq(page)

  await page.getByPlaceholder('Kirjoita kysymys').fill(question)

  await page.getByRole('button', { name: 'Lisää tekstiosio' }).click()
  await page.getByPlaceholder('Kirjoita tekstiosion sisältö').last().fill(firstBlock)

  await page.getByRole('button', { name: 'Lisää tekstiosio' }).click()
  await page.getByPlaceholder('Kirjoita tekstiosion sisältö').last().fill(secondBlock)

  const secondBlockCard = page.locator('div').filter({ hasText: 'Tekstiosio 2' }).last()
  await secondBlockCard.getByRole('button', { name: '↑' }).click()

  await page.getByRole('button', { name: 'Lisää kysymys' }).click()

  await openFaqInAdmin(page, question)

  const firstVisible = page.getByText(secondBlock)
  const secondVisible = page.getByText(firstBlock)

  await expect(firstVisible).toBeVisible()
  await expect(secondVisible).toBeVisible()

  const firstBox = await firstVisible.boundingBox()
  const secondBox = await secondVisible.boundingBox()

  expect(firstBox).not.toBeNull()
  expect(secondBox).not.toBeNull()
  expect(firstBox!.y).toBeLessThan(secondBox!.y)
})