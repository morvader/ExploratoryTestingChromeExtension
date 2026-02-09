const { test, expect } = require('@playwright/test');
const {
  launchBrowserWithExtension,
  openExtensionPopup,
  clearExtensionStorage,
  getSessionData,
  waitForStorageUpdate,
} = require('./helpers/extension-helper');

test.describe('Reports and Export Functionality', () => {
  let context;
  let extensionId;
  let popupPage;
  let testPage;

  test.beforeAll(async () => {
    const result = await launchBrowserWithExtension();
    context = result.context;
    extensionId = result.extensionId;
  });

  test.beforeEach(async () => {
    testPage = await context.newPage();
    await testPage.goto('http://localhost:8000/test/e2e/test-pages/index.html');

    popupPage = await openExtensionPopup(context, extensionId);

    // Clear storage and wait extra time to ensure it's fully cleared
    await clearExtensionStorage(popupPage);
    await popupPage.waitForTimeout(500);
    await popupPage.reload();
    await popupPage.waitForTimeout(500);

    // Add some test data
    await popupPage.click('#BugBtn');
    await popupPage.waitForTimeout(300);
    await popupPage.fill('#newBugDescription', 'Test Bug for Export');
    await popupPage.click('#addNewBugBtn');
    await waitForStorageUpdate(popupPage, 300);

    await popupPage.click('#NoteBtn');
    await popupPage.waitForTimeout(300);
    await popupPage.fill('#newNoteDescription', 'Test Note for Export');
    await popupPage.click('#addNewNoteBtn');
    await waitForStorageUpdate(popupPage, 300);

    await popupPage.click('#IdeaBtn');
    await popupPage.waitForTimeout(300);
    await popupPage.fill('#newIdeaDescription', 'Test Idea for Export');
    await popupPage.click('#addNewIdeaBtn');
    await waitForStorageUpdate(popupPage, 300);
  });

  test.afterEach(async () => {
    if (testPage) await testPage.close();
    if (popupPage) await popupPage.close();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should have export buttons visible', async () => {
    // Verify export buttons exist
    await expect(popupPage.locator('#exportCSVBtn')).toBeVisible();
    await expect(popupPage.locator('#exportJsonBtn')).toBeVisible();
    await expect(popupPage.locator('#previewBtn')).toBeVisible();
    await expect(popupPage.locator('#resetBtn')).toBeVisible();
  });

  test('should generate HTML report', async () => {
    const htmlButton = popupPage.locator('#previewBtn');
    await htmlButton.click();

    // Wait for report page to open
    await waitForStorageUpdate(popupPage, 2000);

    // Find the report page
    const pages = context.pages();
    let reportPage = null;

    for (const page of pages) {
      const url = page.url();
      if (url.includes('preview.html') || url.includes('HTMLReport')) {
        reportPage = page;
        break;
      }
    }

    if (reportPage) {
      await reportPage.waitForLoadState('domcontentloaded');

      // Verify report content
      const reportContent = await reportPage.content();
      expect(reportContent).toContain('Test Bug for Export');
      expect(reportContent).toContain('Test Note for Export');
      expect(reportContent).toContain('Test Idea for Export');

      await reportPage.close();
    }
  });

  test('should maintain session data across popup closes', async () => {
    // Get current session
    const originalSession = await getSessionData(popupPage);
    const originalCount = originalSession.annotations.length;
    expect(originalCount).toBeGreaterThanOrEqual(3);

    // Find specific annotation to verify later
    const testBug = originalSession.annotations.find(a => a.name === 'Test Bug for Export');
    expect(testBug).toBeTruthy();

    // Close popup
    await popupPage.close();

    // Reopen popup
    popupPage = await openExtensionPopup(context, extensionId);
    await popupPage.waitForLoadState('domcontentloaded');

    // Verify data persisted
    const newSession = await getSessionData(popupPage);
    expect(newSession.annotations.length).toBe(originalCount);

    // Verify specific annotation persisted
    const persistedBug = newSession.annotations.find(a => a.name === 'Test Bug for Export');
    expect(persistedBug).toBeTruthy();
    expect(persistedBug.type).toBe('Bug');
  });

  test('should show correct statistics in counters', async () => {
    // Reload to update counters
    await popupPage.reload();
    await popupPage.waitForTimeout(500);

    const bugCounter = await popupPage.locator('#bugCounter').textContent();
    const noteCounter = await popupPage.locator('#noteCounter').textContent();
    const ideaCounter = await popupPage.locator('#ideaCounter').textContent();

    expect(parseInt(bugCounter.trim() || '0')).toBeGreaterThanOrEqual(1);
    expect(parseInt(noteCounter.trim() || '0')).toBeGreaterThanOrEqual(1);
    expect(parseInt(ideaCounter.trim() || '0')).toBeGreaterThanOrEqual(1);
  });
});
