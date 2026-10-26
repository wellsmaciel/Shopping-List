const { defineConfig, devices } = require('@playwright/test');

const port = 3100;

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  // One server and one in-memory database: tests must run one at a time.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node e2e/server.js',
    url: `http://localhost:${port}/api/version`,
    env: { PORT: String(port) },
    reuseExistingServer: false,
    timeout: 30000,
  },
});
