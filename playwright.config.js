// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const isCI = !!process.env.CI;
const isWindows = process.platform === 'win32';

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
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1, // Run tests sequentially for extensions

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
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium-extension',
      use: {
        ...devices['Desktop Chrome'],
        // In CI (Linux), use plain chromium; locally on Windows/macOS use msedge
        ...(isCI ? {} : { channel: 'msedge' }),
        // Note: Extension loading happens in test setup via helper functions
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: isWindows
      ? 'powershell -File ./start_test_server.ps1'
      : 'python3 -m http.server 8000',
    url: 'http://localhost:8000',
    reuseExistingServer: !isCI,
    timeout: 10 * 1000,
  },
});
