import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-admin',
      use: { ...devices['Desktop Chrome'], storageState: 'tmp/admin-auth.json' },
    },
    {
      name: 'chromium-client',
      use: { ...devices['Desktop Chrome'], storageState: 'tmp/client-auth.json' },
    },
    {
      name: 'chromium-operator',
      use: { ...devices['Desktop Chrome'], storageState: 'tmp/operator-auth.json' },
    },
    {
      name: 'firefox-admin',
      use: { ...devices['Desktop Firefox'], storageState: 'tmp/admin-auth.json' },
    },
    {
      name: 'firefox-client',
      use: { ...devices['Desktop Firefox'], storageState: 'tmp/client-auth.json' },
    },
    {
      name: 'webkit-admin',
      use: { ...devices['Desktop Safari'], storageState: 'tmp/admin-auth.json' },
    },
    {
      name: 'webkit-client',
      use: { ...devices['Desktop Safari'], storageState: 'tmp/client-auth.json' },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @nextcommerce/api dev',
      url: 'http://localhost:3001/ready',
      reuseExistingServer: !process.env.CI,
      timeout: 180000,
    },
    {
      command: 'pnpm --filter @nextcommerce/web dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 180000,
    },
  ],
});
