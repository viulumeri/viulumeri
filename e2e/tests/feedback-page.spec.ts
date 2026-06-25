import { test, expect, type Page } from '@playwright/test'
import { MongoClient } from 'mongodb'
import { SEED_USERS } from '../global-setup'
import { markInstallPromptAsSeen, markStartupAnnouncementsAsSeen } from './announcement-state'

const MONGODB_URI =
  process.env.E2E_MONGODB_URI ||
  'mongodb://admin:password@127.0.0.1:27017/viulumeri?authSource=admin'

const student = (() => {
  const found = SEED_USERS.find(user => user.userType === 'student')
  if (!found) {
    throw new Error('No seeded student user found in SEED_USERS')
  }
  return found
})()

const dismissNotificationIfVisible = async (page: Page) => {
  const closeButton = page.getByRole('button', { name: /sulje ilmoitus/i })
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.evaluate(button => {
      ;(button as HTMLElement).click()
    })
    await expect(closeButton).toBeHidden({ timeout: 5_000 })
  }
}

const loginAsStudent = async (page: Page) => {
  await page.goto('/login')
  await markStartupAnnouncementsAsSeen(page, student.email)
  await markInstallPromptAsSeen(page)
  await page.getByPlaceholder('Sähköpostiosoite').fill(student.email)
  await page.getByPlaceholder('Salasana').fill(student.password)
  const signInResponsePromise = page.waitForResponse(response => {
    return (
      response.url().includes('/api/auth/sign-in/email') &&
      response.request().method() === 'POST'
    )
  })

  await page.getByRole('button', { name: /kirjaudu sisään/i }).click()

  const signInResponse = await signInResponsePromise
  expect(
    signInResponse.ok(),
    `Sign-in failed: HTTP ${signInResponse.status()}`
  ).toBe(true)

  await dismissNotificationIfVisible(page)
}

test.describe('FeedbackPage', () => {
  test('student can send 4 feedbacks; spam submission is blocked', async ({ page }) => {
    const runId = Date.now()

    const mongoClient = new MongoClient(MONGODB_URI)
    await mongoClient.connect()
    try {
      const db = mongoClient.db()
      await db.collection('ratelimits').deleteMany({})

      await loginAsStudent(page)
      await page.goto('/feedback')
      await expect(
        page.getByRole('heading', { name: 'Palaute', exact: true })
      ).toBeVisible()

    const feedbacks: Array<{
      title: string
      message: string
    }> = [
      {
        title: `E2E Feedback BUG ${runId}`,
        message: 'E2E: Bugiraportti'
      },
      {
        title: `E2E Feedback FEATURE ${runId}`,
        message: 'E2E: Toive'
      },
      {
        title: `E2E Feedback OTHER ${runId}`,
        message: 'E2E: Muu palaute'
      },
      {
        title: `E2E Feedback BUG 2 ${runId}`,
        message: 'E2E: Toinen bugi'
      }
    ]

    for (const feedback of feedbacks) {
      const responsePromise = page.waitForResponse(response => {
        return (
          response.url().includes('/api/feedback') &&
          response.request().method() === 'POST'
        )
      })

      await page.locator('#feedback-title').fill(feedback.title)
      await page.locator('#feedback-message').fill(feedback.message)
      await page.getByRole('button', { name: /lähetä palaute/i }).click()

      const response = await responsePromise
      expect(response.status(), 'Feedback submission should succeed').toBe(201)

      const body = (await response.json().catch(() => null)) as any
      expect(body?.ok).toBe(true)

      await expect(page.getByRole('status')).toContainText('Kiitos palautteesta!')

      // kentät tyhjenee oikein lähetettäessä
      await expect(page.locator('#feedback-title')).toHaveValue('')
      await expect(page.locator('#feedback-message')).toHaveValue('')

      await dismissNotificationIfVisible(page)
    }

    // varmistetaan, että lähetetyt 4 palautetta näkyy oikeasti tietokannassa
      const expectedTitles = feedbacks.map(f => f.title)
      await expect
        .poll(
          async () =>
            db.collection('feedbacks').countDocuments({
              title: { $in: expectedTitles }
            }),
          { timeout: 10_000 }
        )
        .toBe(4)

      const stored = await db
        .collection('feedbacks')
        .find({ title: { $in: expectedTitles } })
        .project({ title: 1, category: 1, message: 1 })
        .toArray()

    for (const expected of feedbacks) {
      const doc = stored.find(d => d.title === expected.title) as any
      expect(doc, `Missing feedback in DB: ${expected.title}`).toBeTruthy()
      expect(doc.category).toBe('other')
      expect(doc.message).toBe(expected.message)
    }

    // spammin lähetysyritys

    const spamTitle = `E2E Feedback SPAM ${runId}`
    let spamInjected = false
    await page.route('**/api/feedback', async (route, request) => {
      if (request.method() !== 'POST' || spamInjected) {
        await route.continue()
        return
      }

      spamInjected = true

      let data: any = {}
      try {
        data = request.postDataJSON()
      } catch {
        try {
          data = JSON.parse(request.postData() || '{}')
        } catch {
          data = {}
        }
      }

      data.website = 'https://spam.invalid'

      const headers = { ...request.headers() }
      delete headers['content-length']
      headers['content-type'] = 'application/json'

      await route.continue({
        headers,
        postData: JSON.stringify(data)
      })
    })

    const spamResponsePromise = page.waitForResponse(response => {
      return (
        response.url().includes('/api/feedback') &&
        response.request().method() === 'POST'
      )
    })

    await page.locator('#feedback-title').fill(spamTitle)
    await page.locator('#feedback-message').fill('E2E: Tämä on validi viesti, mutta spam-trappi estää.')
    await page.getByRole('button', { name: /lähetä palaute/i }).click()

    const spamResponse = await spamResponsePromise
    expect(spamResponse.status(), 'Spam submission should be rejected').toBe(400)

    await expect(page.getByRole('alert')).toContainText(/spam-suoja/i)

    // varmistetaan, ettei spamviesti ole tietokannassa
      const spamCount = await db
        .collection('feedbacks')
        .countDocuments({ title: spamTitle })
      expect(spamCount).toBe(0)
    } finally {
      await mongoClient.close()
    }
  })
})
