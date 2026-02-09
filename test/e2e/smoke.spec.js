const { test, expect } = require('@playwright/test');
const {
  launchBrowserWithExtension,
  openExtensionPopup,
} = require('./helpers/extension-helper');

/**
 * Smoke tests - Quick verification that the extension loads and basic functionality works
 * Run this first to ensure the test environment is set up correctly
 */
test.describe('Smoke Tests', () => {
  let context;
  let extensionId;

  test.beforeAll(async () => {
    // Launch browser once for all smoke tests
    const result = await launchBrowserWithExtension();
    context = result.context;
    extensionId = result.extensionId;
  });

  test.afterAll(async () => {
    await context.close();
    // Wait a bit for cleanup before next test suite
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test('extension loads successfully', async () => {
    // Verify we got an extension ID
    expect(extensionId).toBeTruthy();
    expect(extensionId).toMatch(/^[a-z]{32}$/); // Chrome extension IDs are 32 lowercase letters

    // Open popup
    const popupPage = await openExtensionPopup(context, extensionId);

    // Verify popup loaded
    await expect(popupPage.locator('body')).toBeVisible();

    // Cleanup
    await popupPage.close();
  });

  test('can navigate to test page', async () => {
    // Open a test page
    const page = await context.newPage();
    await page.goto('http://localhost:8000/test/e2e/test-pages/index.html');

    // Verify page loaded
    await expect(page.locator('body')).toBeVisible();

    // Cleanup
    await page.close();
  });

  test('extension popup has required elements', async () => {
    const popupPage = await openExtensionPopup(context, extensionId);

    // Wait for elements to be visible (use Playwright locators with timeout)
    await expect(popupPage.locator('#BugBtn')).toBeVisible({ timeout: 10000 });
    await expect(popupPage.locator('#NoteBtn')).toBeVisible();
    await expect(popupPage.locator('#IdeaBtn')).toBeVisible();
    await expect(popupPage.locator('#QuestionBtn')).toBeVisible();

    console.log('✅ All required elements found');

    // Cleanup
    await popupPage.close();
  });
});
