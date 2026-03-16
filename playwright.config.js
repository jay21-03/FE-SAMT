import { defineConfig } from '@playwright/test'

const frontendPort = 4174
const frontendHost = '127.0.0.1'
const baseURL = `http://${frontendHost}:${frontendPort}`

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
      command: `npm run dev -- --host=${frontendHost} --port=${frontendPort} --strictPort`,
      url: baseURL,
      reuseExistingServer: false,
      timeout: 120000,
    }
  ],
})
