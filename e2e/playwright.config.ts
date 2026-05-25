import { defineConfig, devices } from '@playwright/test'

const DEFAULT_SERVER_URL = 'http://localhost:3001'
const DEFAULT_UI_URL = 'http://localhost:5173'

const serverUrl = process.env.BASE_URL || DEFAULT_SERVER_URL
const uiUrl = process.env.E2E_UI_URL || DEFAULT_UI_URL

const mongodbUri =
  process.env.E2E_MONGODB_URI ||
  'mongodb://admin:password@localhost:27017/viulumeri?authSource=admin'

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html'], ['github']] : 'html',
  webServer: [
    {
      // API server (Better Auth + Express)
      command: 'npm --prefix .. --workspace=server run dev',
      url: `${serverUrl}/ping`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        PORT: '3001',
        NODE_ENV: 'test',
        TEST_MONGODB_URI: mongodbUri,
        E2E_SEED: 'true'
      }
    },
    {
      // UI (Vite). Proxies /api -> :3001
      command: 'npm --prefix .. --workspace=client run dev -- --port 5173 --strictPort',
      url: `${uiUrl}/login`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    }
  ],
  use: {
    baseURL: uiUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
