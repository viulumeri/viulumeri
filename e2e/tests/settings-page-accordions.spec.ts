import { test, expect } from '@playwright/test'
import { SEED_USERS } from '../global-setup'


// Salasanan vaihto -haitari aukeaa ja sulkeutuu klikattaessa.
test('Password accordion opens and closes when clicked', async ({ page }) => {
  await page.goto('/login')

  await page.getByPlaceholder('Sähköpostiosoite').fill(SEED_USERS[0].email)
  await page.getByPlaceholder('Salasana').fill(SEED_USERS[0].password)

  await page.getByRole('button', { name: 'Kirjaudu sisään' }).click()
  await expect(page).toHaveURL('/teacher/students')
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
  await page.goto('/login')

  await page.getByPlaceholder('Sähköpostiosoite').fill(SEED_USERS[0].email)
  await page.getByPlaceholder('Salasana').fill(SEED_USERS[0].password)

  await page.getByRole('button', { name: 'Kirjaudu sisään' }).click()
  await expect(page).toHaveURL('/teacher/students')
  await page.goto('/settings')


  //Avautuu.
  await page.getByText('Usein kysytyt kysymykset').click()

  await expect(
    page.getByText('Kuinka voin vaihtaa sähköpostiosoitteeni?')
  ).toBeVisible()


  //Sulkeutuu.
  await page.getByText('Usein kysytyt kysymykset').click()

  await expect(
    page.getByText('Kuinka voin vaihtaa sähköpostiosoitteeni?')
  ).not.toBeVisible()
})


//Molemmat haitarit avautuvat yhtä aikaa.
test('Both accordions open when clicked', async ({ page }) => {
    await page.goto('/login')

    await page.getByPlaceholder('Sähköpostiosoite').fill(SEED_USERS[0].email)
    await page.getByPlaceholder('Salasana').fill(SEED_USERS[0].password)

    await page.getByRole('button', { name: 'Kirjaudu sisään' }).click()
    await expect(page).toHaveURL('/teacher/students')
    await page.goto('/settings')

    await page.getByText('Salasanan vaihto').click()
    await page.getByText('Usein kysytyt kysymykset').click()

    await expect(page.getByLabel('Nykyinen salasana:')).toBeVisible()
    await expect(page.getByLabel('Uusi salasana:')).toBeVisible()
    await expect(page.getByLabel('Kirjoita uusi salasana uudelleen:')).toBeVisible()
    await expect(page.getByText('Kuinka voin vaihtaa sähköpostiosoitteeni?')).toBeVisible()

})