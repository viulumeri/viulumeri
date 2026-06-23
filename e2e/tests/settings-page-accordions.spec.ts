import { test, expect } from '@playwright/test'
import { SEED_USERS } from '../global-setup'
import { markInstallPromptAsSeen, markStartupAnnouncementsAsSeen } from './announcement-state'

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
  await markInstallPromptAsSeen(page)
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
  await markInstallPromptAsSeen(page)
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
  await markInstallPromptAsSeen(page)
  await page.goto('/settings')

  await page.getByText('Salasanan vaihto').click()
  await page.getByText('Usein kysytyt kysymykset').click()

  await expect(page.getByLabel('Nykyinen salasana:')).toBeVisible()
  await expect(page.getByLabel('Uusi salasana:')).toBeVisible()
  await expect(page.getByLabel('Kirjoita uusi salasana uudelleen:')).toBeVisible()

})

test('Install instruction accordion opens, closes and shows contents', async ({ page }) => {
  await page.context().clearCookies()
  await page.goto('/login')

  await page.getByPlaceholder('Sähköpostiosoite').fill(TEACHER.email)
  await page.getByPlaceholder('Salasana').fill(TEACHER.password)

  await page.getByRole('button', { name: 'Kirjaudu sisään' }).click()
  await page.waitForURL('**/teacher/students')
  await expect(page).toHaveURL('/teacher/students')
  await markStartupAnnouncementsAsSeen(page, TEACHER.email)
  await markInstallPromptAsSeen(page)
  await page.goto('/settings')

  // Teacher opens installation instructions
  await page.getByText('Asennusohjeet').click()

  // Opened tab, shows android and ios buttons
  await expect(page.getByTestId('install-ios')).toBeVisible();
  await expect(page.getByTestId('install-android')).toBeVisible();

  // Verify that teacher sees ios install prompt
  await page.getByTestId('install-ios').click()
  await expect(page.getByText('Sovelluksen asennus')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('iPhone / iPad')).toBeVisible({ timeout: 15_000 })
  
  // Verify that images show
  await expect(page.getByAltText('kolmepistevalikko')).toBeVisible()
  await expect(page.getByAltText('Jaa-painike')).toBeVisible()
  await expect(page.getByAltText('lisää aloitusnäyttöön')).toBeVisible()
  
  // Dismiss the instructions
  await page.getByText('OK').click()

  // Verify that teacher sees android install prompt
  await page.getByTestId('install-android').click()
  await expect(page.getByText('Sovelluksen asennus')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByLabel('Asenna sovellus').getByText('Android')).toBeVisible({ timeout: 15_000 })
  
  // Verify that images show
  await expect(page.getByAltText('Asennusilmoitus')).toBeVisible()
  await expect(page.getByAltText('Aloitusnäyttöön lisäys')).toBeVisible()
  await expect(page.getByAltText('Valitse install')).toBeVisible()
  await expect(page.getByAltText('paina asenna')).toBeVisible()

})
