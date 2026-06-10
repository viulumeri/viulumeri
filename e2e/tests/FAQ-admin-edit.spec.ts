
import { test, expect, type Page } from '@playwright/test'
import { SEED_USERS } from '../global-setup'
import { markInstallPromptAsSeen, markStartupAnnouncementsAsSeen } from './announcement-state'

const ADMIN = SEED_USERS.find(user => user.userType === 'admin')
if (!ADMIN) {
  throw new Error('No seeded admin user found in SEED_USERS')
}

const closeNotificationsIfOpen = async (page: Page) => {
  const dialog = page.getByRole('dialog', { name: 'Ilmoitukset' })
  const okButton = dialog.getByRole('button', { name: 'OK' })

  try {
    await expect(dialog).toBeVisible({ timeout: 3000 })
    await okButton.click()
    await expect(dialog).toBeHidden()
  } catch {
  }
}

async function loginAsAdmin(page: Page) {
  await page.goto('/login')

  await page.getByPlaceholder('Sähköpostiosoite').fill(ADMIN.email)
  await page.getByPlaceholder('Salasana').fill(ADMIN.password)

  await page.getByRole('button', { name: 'Kirjaudu sisään' }).click()
  await page.waitForURL(url => !url.pathname.endsWith('/login'), { timeout: 15_000 })
  await markStartupAnnouncementsAsSeen(page, ADMIN.email)
  await markInstallPromptAsSeen(page)
  await page.goto('/admin')
  await expect(page).toHaveURL('/admin')
}

// Admin voi lisätä uuden kysymyksen
// "Lisää uusi kysymys" -haitariin ja tarkastella sitä.

//Kirjaudutaan Hallintapaneeli-sivulle adminina.
test('Admin can add questions for FAQ', async ({ page }) => {
  await loginAsAdmin(page)

  // Avataan 'Lisää uusi kysymys' -haitari.
const addFaqAccordion = page.getByRole('button', {
  name: 'Lisää uusi kysymys'
})
await expect(addFaqAccordion).toBeVisible()
await addFaqAccordion.click()
await page.waitForTimeout(300)

await expect(
  page.getByPlaceholder(/Kysymys/i)
).toBeVisible()

await expect(
  page.getByPlaceholder(/Vastaus/i)
).toBeVisible()

//Lisätään uusi kysymys ja vastaus.
const question = `Uusi lisätty kysymys / lisäys ${Date.now()}`
const answer = `Uuden lisätyn kysymyksen vastaus / lisäys. ${Date.now()}`
const today = new Date()
const formattedDate = `${today.getDate()}.${
  today.getMonth() + 1
}.${today.getFullYear()}`


await page.getByPlaceholder(/Kysymys/i).fill(question)
await page.getByPlaceholder(/Vastaus/i).fill(answer)

// Tallennetaan
await page.getByRole('button', { name: 'Lisaa kysymys' }).click()

// Tarkistetaan että uusi kysymys näkyy 'Usein kysytyt kysymykset' -haitarissa
// Hallintapaneelissa.
await page.getByRole('button', {
  name: 'Selaa ja muokkaa kysymyksiä'
}).click()

await expect(page.getByText(question)).toBeVisible()
await page.getByText(question).click()
await expect(page.getByText(answer)).toBeVisible()
await expect(page.getByText(answer)).toBeVisible()
await expect(page.getByText(`Lisatty: ${formattedDate}`)).toBeVisible()

// Tarkistetaan että uusi kysymys näkyy
// 'Usein kysytyt kysymykset' -haitarissa Asetuksissa.

//Mennään sivulle Asetukset.
await page.goto('/settings')
await closeNotificationsIfOpen(page)

await page.getByRole('button', {
  name: /Usein kysytyt kysymykset/
}).click()

//Tarkistetaan kysymys ja vastaus Asetuksissa.
await expect(page.getByText(question)).toBeVisible()
await page.getByRole('button', {
  name: question
}).click()

await expect(page.getByText(answer)).toBeVisible()
await expect(page.getByText(`Lisätty: ${formattedDate}`)).toBeVisible()
})

// Admin voi poistaa kysymyksen
// "Lisää uusi kysymys" -haitarista  ja tarkastella muutosta.

//Kirjaudutaan Hallintapaneeli-sivulle adminina.
test('Admin can remove questions from FAQ', async ({ page }) => {
  await loginAsAdmin(page)

  // Avataan 'Lisää uusi kysymys' -haitari.
const addFaqAccordion = page.getByRole('button', {
  name: 'Lisää uusi kysymys'
})
await expect(addFaqAccordion).toBeVisible()
await addFaqAccordion.click()
await page.waitForTimeout(300)

await expect(
  page.getByPlaceholder(/Kysymys/i)
).toBeVisible()

await expect(
  page.getByPlaceholder(/Vastaus/i)
).toBeVisible()

//Lisätään uusi kysymys ja vastaus.
const question = `Uusi lisätty kysymys / poisto ${Date.now()}`
const answer = `Uuden lisätyn kysymyksen vastaus / poisto. ${Date.now()}`

await page.getByPlaceholder(/Kysymys/i).fill(question)
await page.getByPlaceholder(/Vastaus/i).fill(answer)

// Tallennetaan
await page.getByRole('button', { name: 'Lisaa kysymys' }).click()

// Tarkistetaan että uusi kysymys näkyy 'Usein kysytyt kysymykset' -haitarissa
// Hallintapaneelissa.
await page.getByRole('button', { name: 'Selaa ja muokkaa kysymyksiä'}).click()

await expect(page.getByText(question)).toBeVisible()
await page.getByText(question).click()
await expect(page.getByText(answer)).toBeVisible()

// Poistetaan kysymys.
await page.getByRole('button', { name: 'Poista', exact: true }).click()
await expect(page.getByText(question)).not.toBeVisible()

// Mennään sivulle Asetukset.
await page.goto('/settings')
await closeNotificationsIfOpen(page)

await page.getByRole('button', {
  name: /Usein kysytyt kysymykset/
}).click()

// Varmistetaan ettei kysymys näy enää käyttäjälle
await expect(
  page.getByText(question)
).not.toBeAttached()

})


// Admin voi muokata uuden kysymyksen
// "Lisää uusi kysymys" -haitarista  ja tarkastella muutosta.

//Kirjaudutaan Hallintapaneeli-sivulle adminina.
test('Admin can edit questions in FAQ', async ({ page }) => {
  await loginAsAdmin(page)

  // Avataan 'Lisää uusi kysymys' -haitari.
const addFaqAccordion = page.getByRole('button', {
  name: 'Lisää uusi kysymys'
})
await expect(addFaqAccordion).toBeVisible()
await addFaqAccordion.click()
await page.waitForTimeout(300)

await expect(
  page.getByPlaceholder(/Kysymys/i)
).toBeVisible()

await expect(
  page.getByPlaceholder(/Vastaus/i)
).toBeVisible()

//Lisätään uusi kysymys ja vastaus.
const question = `Uusi lisätty kysymys / muokkaus ${Date.now()}`
const answer = `Uuden lisätyn kysymyksen vastaus / muokkaus. ${Date.now()}`

await page.getByPlaceholder(/Kysymys/i).fill(question)
await page.getByPlaceholder(/Vastaus/i).fill(answer)
const today = new Date()
const formattedDate = `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear()}`

// Tallennetaan
await page.getByRole('button', { name: 'Lisaa kysymys' }).click()

// Tarkistetaan että uusi kysymys näkyy 'Usein kysytyt kysymykset' -haitarissa
// Hallintapaneelissa.
await page.getByRole('button', { name: 'Selaa ja muokkaa kysymyksiä'}).click()

await expect(page.getByText(question)).toBeVisible()
await page.getByText(question).click()
await expect(page.getByText(answer)).toBeVisible()

await page.getByRole('button', { name: 'Muokkaa', exact: true }).click()

const editedQuestion = `Muokattu kysymys ${Date.now()}`
const editedAnswer = `Muokattu vastaus ${Date.now()}`

await page.locator('input:visible').last().fill(editedQuestion)
await page.locator('textarea:visible').last().fill(editedAnswer)

await expect(
  page.locator('textarea:visible').last()
).toHaveValue(editedAnswer)

await page.getByRole('button', { name: 'Tallenna', exact: true }).click()

await page.reload()
await closeNotificationsIfOpen(page)


await page.getByRole('button', {
  name: 'Selaa ja muokkaa kysymyksiä'
}).click()

await expect(page.getByText(editedQuestion)).toBeVisible()

await page.getByText(editedQuestion).click()

await expect(
  page.getByText(editedAnswer)
).toBeVisible()

// Tarkistetaan että muokattu sisältö näkyy Hallintapaneelissa
await expect(
  page.getByText(editedQuestion)
).toBeVisible()

await expect(
  page.getByText(`Paivitetty: ${formattedDate}`)
).toBeVisible()

// Varmistetaan että vanhat arvot poistuivat
await expect(
  page.getByText(question)
).not.toBeAttached()

await expect(
  page.getByText(answer)
).not.toBeAttached()

// Mennään Asetukset-sivulle
await page.goto('/settings')
await closeNotificationsIfOpen(page)
await page.getByRole('button', {
  name: /Usein kysytyt kysymykset/
}).click()

// Tarkistetaan että muutos näkyy käyttäjän FAQ:ssa
await expect(page.getByText(editedQuestion)).toBeVisible()

await page.getByRole('button', {
  name: editedQuestion
}).click()

await expect(page.getByText(editedAnswer)).toBeVisible()
await expect(page.getByText(`Päivitetty: ${formattedDate}`)).toBeVisible()


// Tarkistetaan ettei vanha sisältö näy enää
await expect(
  page.getByText(question)
).not.toBeAttached()

await expect(
  page.getByText(answer)
).not.toBeAttached()

})
