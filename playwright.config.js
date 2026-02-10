// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

/**
 * Playwright configuration for Chrome Extension E2E testing
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './test/e2e',

  // Maximum time one test can run for
  timeout: 60 * 1000,

  // Test execution settings
  fullyParallel: false, // Extensions can't run fully parallel easily
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1, // Run tests sequentially for extensions

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for testing (points to test pages)
    baseURL: 'http://localhost:8000/test/e2e/test-pages',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Slower actions for better stability with extensions
    actionTimeout: 10 * 1000,
    headless: true, // Uses --headless=new which supports extensions (Chrome 109+)

  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium-extension',
      use: {
        ...devices['Desktop Chrome'],
        // Edge has the best extension support with Playwright
        channel: 'msedge', // Use Microsoft Edge - works best with extensions
        // Note: Extension loading happens in test setup via helper functions
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'powershell -File ./start_test_server.ps1',
    url: 'http://localhost:8000',
    reuseExistingServer: !process.env.CI,
    timeout: 10 * 1000,
  },
});
