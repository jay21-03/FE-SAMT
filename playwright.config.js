import { defineConfig } from '@playwright/test'

const frontendPort = 4174
const frontendHost = '127.0.0.1'
const baseURL = `http://${frontendHost}:${frontendPort}`

// LIVE E2E can target a real backend by setting one of:
// - E2E_API_URL (recommended for Playwright runs)
// - VITE_API_URL (standard Vite env)
const apiUrl = process.env.E2E_API_URL || process.env.VITE_API_URL
const requestTimeoutMs = process.env.E2E_REQUEST_TIMEOUT_MS || process.env.VITE_REQUEST_TIMEOUT_MS
const webServerCommand = apiUrl
  ? `cmd /c "set VITE_API_URL=${apiUrl}&& ${requestTimeoutMs ? `set VITE_REQUEST_TIMEOUT_MS=${requestTimeoutMs}&& ` : ''}npm run dev -- --host=${frontendHost} --port=${frontendPort} --strictPort"`
  : `npm run dev -- --host=${frontendHost} --port=${frontendPort} --strictPort`

export default defineConfig({
  testDir: './e2e-tests',
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: webServerCommand,
      url: baseURL,
      reuseExistingServer: false,
      timeout: 120000,
    }
  ],
})
