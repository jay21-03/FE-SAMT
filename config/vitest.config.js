import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const configDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: resolve(configDir, '..'),
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup/setupTests.js',
    include: ['src/tests/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    restoreMocks: true,
    clearMocks: true,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: [
        'src/api/**/*.{js,jsx,ts,tsx}',
        'src/hooks/**/*.{js,jsx,ts,tsx}',
        'src/router/**/*.{js,jsx,ts,tsx}',
        'src/schemas/**/*.{js,jsx,ts,tsx}',
        'src/config/**/*.{js,jsx,ts,tsx}',
      ],
      exclude: [
        'src/main.jsx',
        'src/**/*.test.*',
        'src/vite-env.d.ts',
        'src/types/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
