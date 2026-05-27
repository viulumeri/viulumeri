# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/tests/settings-page-accordions.spec.ts >> Both accordions open when clicked
- Location: e2e/tests/settings-page-accordions.spec.ts:78:5

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | import { SEED_USERS } from '../global-setup'
  3  | 
  4  | 
  5  | // Salasanan vaihto -haitari aukeaa ja sulkeutuu klikattaessa.
  6  | test('password accordion opens when clicked', async ({ page }) => {
  7  |   await page.goto('/login')
  8  | 
  9  |   await page.getByLabel('Sähköposti').fill(SEED_USERS[0].email)
  10 |   await page.getByLabel('Salasana').fill(SEED_USERS[0].password)
  11 | 
  12 |   await page.getByRole('button', { name: 'Kirjaudu sisään' }).click()
  13 | 
  14 |   await page.goto('/settings')
  15 | 
  16 |   // Avautuu.
  17 |   await page.getByText('Salasanan vaihto').click()
  18 | 
  19 |   await expect(
  20 |     page.getByLabel('Nykyinen salasana:')
  21 |   ).toBeVisible()
  22 | 
  23 |   await expect(
  24 |     page.getByLabel('Uusi salasana:')
  25 |   ).toBeVisible()
  26 | 
  27 |     await expect(
  28 |     page.getByLabel('Kirjoita uusi salasana uudelleen:')
  29 |   ).toBeVisible()
  30 | 
  31 | 
  32 |     // Sulkeutuu.
  33 |   await page.getByText('Salasanan vaihto').click()
  34 | 
  35 |   await expect(
  36 |     page.getByLabel('Nykyinen salasana:')
  37 |   ).not.toBeVisible()
  38 | 
  39 |   await expect(
  40 |     page.getByLabel('Uusi salasana:')
  41 |   ).not.toBeVisible()
  42 | 
  43 |     await expect(
  44 |     page.getByLabel('Kirjoita uusi salasana uudelleen:')
  45 |   ).not.toBeVisible()
  46 | })
  47 | 
  48 | //Usein kysytyt kysymykset -haitari aukeaa ja sulkeutuu klikattaessa.
  49 | test('FAQ accordion opens when clicked', async ({ page }) => {
  50 |   await page.goto('/login')
  51 | 
  52 |   await page.getByLabel('Sähköposti').fill(SEED_USERS[0].email)
  53 |   await page.getByLabel('Salasana').fill(SEED_USERS[0].password)
  54 | 
  55 |   await page.getByRole('button', { name: 'Kirjaudu sisään' }).click()
  56 | 
  57 |   await page.goto('/settings')
  58 | 
  59 | 
  60 |   //Avautuu.
  61 |   await page.getByText('Usein kysytyt kysymykset').click()
  62 | 
  63 |   await expect(
  64 |     page.getByText('Kuinka voin vaihtaa sähköpostiosoitteeni?')
  65 |   ).toBeVisible()
  66 | 
  67 | 
  68 |   //Sulkeutuu.
  69 |   await page.getByText('Usein kysytyt kysymykset').click()
  70 | 
  71 |   await expect(
  72 |     page.getByText('Kuinka voin vaihtaa sähköpostiosoitteeni?')
  73 |   ).not.toBeVisible()
  74 | })
  75 | 
  76 | 
  77 | //Molemmat haitarit avautuvat yhtä aikaa.
  78 | test('Both accordions open when clicked', async ({ page }) => {
> 79 |     await page.goto('/login')
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  80 | 
  81 |     await page.getByLabel('Sähköposti').fill(SEED_USERS[0].email)
  82 |     await page.getByLabel('Salasana').fill(SEED_USERS[0].password)
  83 | 
  84 |     await page.getByRole('button', { name: 'Kirjaudu sisään' }).click()
  85 | 
  86 |     await page.goto('/settings')
  87 | 
  88 |     await page.getByText('Salasanan vaihto').click()
  89 |     await page.getByText('Usein kysytyt kysymykset').click()
  90 | 
  91 |     await expect(page.getByLabel('Nykyinen salasana:')).toBeVisible()
  92 |     await expect(page.getByLabel('Uusi salasana:')).toBeVisible()
  93 |     await expect(page.getByLabel('Kirjoita uusi salasana uudelleen:')).toBeVisible()
  94 |     await expect(page.getByText('Kuinka voin vaihtaa sähköpostiosoitteeni?')).toBeVisible()
  95 | 
  96 | })
```