import { test, expect } from '@playwright/test'
import { SEED_USERS } from '../global-setup'
import { markStartupAnnouncementsAsSeen } from './announcement-state'

const TEACHER = SEED_USERS.find(user => user.userType === 'teacher')

if (!TEACHER) {
  throw new Error('No seeded teacher user found in SEED_USERS')
}


// Salasanan vaihto -haitari aukeaa ja sulkeutuu klikattaessa.
test('Password accordion opens and closes when clicked', async ({ page }) => {
  await page.context().clearCookies()
  await page.goto('/login')

  await page.getByPlaceholder('Sähköpostiosoite').fill(TEACHER.email)
  await page.getByPlaceholder('Salasana').fill(TEACHER.password)

  await page.getByRole('button', { name: 'Kirjaudu sisään' }).click()
  await page.waitForURL('**/teacher/students')
  await expect(page).toHaveURL('/teacher/students')
  await markStartupAnnouncementsAsSeen(page, TEACHER.email)
  await page.goto('/settings')

  // Avautuu.
  await page.getByText('Salasanan vaihto').click()

  await expect(
    page.getByLabel('Nykyinen salasana:')
  ).toBeVisible()

  await expect(
    page.getByLabel('Uusi salasana:')
  ).toBeVisible()

    await expect(
    page.getByLabel('Kirjoita uusi salasana uudelleen:')
  ).toBeVisible()


    // Sulkeutuu.
  await page.getByText('Salasanan vaihto').click()

  await expect(
    page.getByLabel('Nykyinen salasana:')
  ).not.toBeVisible()

  await expect(
    page.getByLabel('Uusi salasana:')
  ).not.toBeVisible()

    await expect(
    page.getByLabel('Kirjoita uusi salasana uudelleen:')
  ).not.toBeVisible()
})

//Usein kysytyt kysymykset -haitari aukeaa ja sulkeutuu klikattaessa.
test('FAQ accordion opens and closes when clicked', async ({ page }) => {
  await page.context().clearCookies()
  await page.goto('/login')

  await page.getByPlaceholder('Sähköpostiosoite').fill(TEACHER.email)
  await page.getByPlaceholder('Salasana').fill(TEACHER.password)

  await page.getByRole('button', { name: 'Kirjaudu sisään' }).click()
  await page.waitForURL('**/teacher/students')
  await expect(page).toHaveURL('/teacher/students')
  await markStartupAnnouncementsAsSeen(page, TEACHER.email)
  await page.goto('/settings')


  //Avautuu.
  await page.getByText('Usein kysytyt kysymykset').click()

  //Sulkeutuu.
  await page.getByText('Usein kysytyt kysymykset').click()

})


//Molemmat haitarit avautuvat yhtä aikaa.
test('Both accordions open when clicked', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/login')

  await page.getByPlaceholder('Sähköpostiosoite').fill(TEACHER.email)
  await page.getByPlaceholder('Salasana').fill(TEACHER.password)

    await page.getByRole('button', { name: 'Kirjaudu sisään' }).click()
    await page.waitForURL('**/teacher/students')
    await expect(page).toHaveURL('/teacher/students')
    await markStartupAnnouncementsAsSeen(page, TEACHER.email)
    await page.goto('/settings')

    await page.getByText('Salasanan vaihto').click()
    await page.getByText('Usein kysytyt kysymykset').click()

    await expect(page.getByLabel('Nykyinen salasana:')).toBeVisible()
    await expect(page.getByLabel('Uusi salasana:')).toBeVisible()
    await expect(page.getByLabel('Kirjoita uusi salasana uudelleen:')).toBeVisible()

})
