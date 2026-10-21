const { test, expect } = require('@playwright/test');
const {
  launchBrowserWithExtension,
  openExtensionPopup,
} = require('./helpers/extension-helper');

/**
 * Tutorial tests - Driver.js tour in tutorial.html and the popup entry points
 * (automatic first-run tab and the help button).
 */
test.describe('Tutorial', () => {
  let context;
  let extensionId;

  const tutorialPages = () => context.pages().filter(p => p.url().endsWith('/tutorial.html'));

  test.beforeAll(async () => {
    const result = await launchBrowserWithExtension();
    context = result.context;
    extensionId = result.extensionId;
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.afterEach(async () => {
    for (const page of context.pages()) {
      await page.close();
    }
  });

  test('opens the tutorial automatically the first time the popup is shown', async () => {
    const tutorialOpened = context.waitForEvent('page', {
      predicate: p => p.url().endsWith('/tutorial.html') || p.url() === 'about:blank',
      timeout: 10000,
    });
    await openExtensionPopup(context, extensionId, { firstRun: true });
    await tutorialOpened;

    await expect.poll(() => tutorialPages().length, { timeout: 10000 }).toBe(1);
  });

  test('does not open the tutorial again once it has been seen', async () => {
    await openExtensionPopup(context, extensionId);
    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(tutorialPages()).toHaveLength(0);
  });

  test('help button opens the tutorial', async () => {
    const popupPage = await openExtensionPopup(context, extensionId);

    await popupPage.locator('#helpBtn').click();

    await expect.poll(() => tutorialPages().length, { timeout: 10000 }).toBe(1);
  });

  test('tour walks every step and the last one points to the help button', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/tutorial.html`);

    const popover = page.locator('.driver-popover');
    await expect(popover).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.driver-popover-title')).toHaveText('Welcome');

    // Every step after the welcome one must highlight a real element.
    let guard = 0;
    while (!(await page.locator('.driver-popover-next-btn').innerText()).includes('Finish')) {
      await page.locator('.driver-popover-next-btn').click();
      await expect(page.locator('.driver-active-element')).toHaveCount(1);
      expect(++guard).toBeLessThan(50);
    }

    await expect(page.locator('.driver-popover-title')).toHaveText('Want to see this again?');
    await expect(page.locator('.driver-active-element')).toHaveAttribute('data-tour', 'help');

    await page.locator('.driver-popover-next-btn').click();
    await expect(popover).toBeHidden();
  });

  test('tutorial loads Driver.js from the extension, not from a CDN', async () => {
    const externalRequests = [];
    const page = await context.newPage();
    page.on('request', request => {
      const url = request.url();
      if (!url.startsWith('chrome-extension://') && !url.startsWith('data:')) {
        externalRequests.push(url);
      }
    });

    await page.goto(`chrome-extension://${extensionId}/tutorial.html`);
    await expect(page.locator('.driver-popover')).toBeVisible({ timeout: 10000 });

    expect(externalRequests).toEqual([]);
  });
});
