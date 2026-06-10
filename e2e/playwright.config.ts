import { defineConfig, devices } from '@playwright/test'

const DEFAULT_SERVER_URL = 'http://localhost:3001'
const DEFAULT_UI_URL = 'http://localhost:5173'

const isCI =
  (process.env.CI === 'true' || process.env.CI === '1') &&
  process.env.GITHUB_ACTIONS === 'true'

const uiUrl = process.env.E2E_UI_URL || DEFAULT_UI_URL
const defaultServerPort = '3001'
const serverPort = process.env.E2E_SERVER_PORT || defaultServerPort
const serverUrl = process.env.E2E_SERVER_URL || `http://localhost:${serverPort}`

const mongodbUri =
  process.env.E2E_MONGODB_URI ||
  'mongodb://admin:password@127.0.0.1:27017/viulumeri?authSource=admin'

// Ensure globalSetup (and any other helpers) point to the same API origin.
process.env.BASE_URL = serverUrl

const webServer = isCI
  ? [
      {
        // CI: build the client and let the backend serve client/dist.
        // This avoids Better Auth origin issues through a dev proxy.
        command:
          'npm --prefix .. --workspace=client run build && npm --prefix .. --workspace=server run dev',
        url: `${serverUrl}/ping`,
        reuseExistingServer: true,
        timeout: 120_000,
        timeout: 180_000,
        env: {
          PORT: serverPort,
          NODE_ENV: 'test',
          TEST_MONGODB_URI: mongodbUri,
          CLIENT_URL: serverUrl,
          E2E_SEED: 'true'
        }
      }
    ]
  : [
      {
        // API server (Better Auth + Express)
        command: 'npm --prefix .. --workspace=server run dev',
        url: `${serverUrl}/ping`,
        reuseExistingServer: true,
        timeout: 120_000,
        env: {
          PORT: serverPort,
          NODE_ENV: 'test',
          TEST_MONGODB_URI: mongodbUri,
          CLIENT_URL: uiUrl,
          E2E_SEED: 'true'
        }
      },
      {
        // UI (Vite). Proxies /api -> :3001
        command:
          'npm --prefix .. --workspace=client run dev -- --port 5173 --strictPort',
        url: `${uiUrl}/login`,
        reuseExistingServer: true,
        timeout: 120_000
      }
    ]

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['html'], ['github']] : 'html',
  webServer,
  use: {
    baseURL: isCI ? serverUrl : uiUrl,
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
