const path = require('path');
const fs = require('fs');
const { chromium } = require('@playwright/test');

/**
 * Extension Helper for Playwright E2E tests
 * Provides utilities to load and interact with the Chrome Extension
 */

/**
 * Launches a browser context with the extension loaded
 * @returns {Promise<{context: import('@playwright/test').BrowserContext, extensionId: string}>}
 */
async function launchBrowserWithExtension() {
  const extensionPath = path.join(__dirname, '../../../');
  const userDataDir = path.join(__dirname, '../.chrome-profile');

  // Clean user data directory to ensure fresh state for each test run
  if (fs.existsSync(userDataDir)) {
    try {
      // Wait a bit for any file locks to release
      await new Promise(resolve => setTimeout(resolve, 500));
      fs.rmSync(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 });
    } catch (error) {
      console.warn(`⚠️ Could not fully clean user data dir: ${error.message}`);
      // Continue anyway - partial cleanup is better than nothing
    }
  }

  // Check for manual extension ID (workaround if auto-detection fails)
  const manualExtensionId = process.env.EXTENSION_ID;

  if (manualExtensionId) {
    console.log(`🔧 Using manual extension ID from environment: ${manualExtensionId}`);
    console.log(`Loading extension from: ${extensionPath}`);

    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
      viewport: { width: 1280, height: 720 },
    });

    // Give extension time to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`✅ Using extension ID: ${manualExtensionId}`);
    return { context, extensionId: manualExtensionId };
  }

  // Auto-detection mode
  console.log(`Loading extension from: ${extensionPath}`);
  console.log('🔧 Using Microsoft Edge (best extension support)');

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'msedge', // Use Microsoft Edge - works better with extensions
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
    viewport: { width: 1280, height: 720 },
  });

  console.log('Browser context launched, waiting for extension to initialize...');
  await new Promise(resolve => setTimeout(resolve, 5000)); // Edge needs more time

  // Try multiple methods to get extension ID
  let extensionId = null;
  const page = await context.newPage();

  try {
    // Method 1: Use CDP to get extension info
    console.log('Attempting to get extension ID via CDP...');
    const client = await context.newCDPSession(page);
    const targets = await client.send('Target.getTargets');

    const extensionTarget = targets.targetInfos.find(target =>
      target.type === 'service_worker' &&
      target.url.includes('chrome-extension://')
    );

    if (extensionTarget) {
      extensionId = extensionTarget.url.split('/')[2];
      console.log(`✅ Extension ID found via CDP: ${extensionId}`);
      await page.close();
      return { context, extensionId };
    }

    // Method 2: Check background pages
    console.log('Trying background pages...');
    const backgroundPages = context.backgroundPages();
    if (backgroundPages.length > 0) {
      extensionId = backgroundPages[0].url().split('/')[2];
      console.log(`✅ Extension ID found via background pages: ${extensionId}`);
      await page.close();
      return { context, extensionId };
    }

    // Method 3: Check service workers
    console.log('Trying service workers...');
    const workers = context.serviceWorkers();
    if (workers.length > 0) {
      extensionId = workers[0].url().split('/')[2];
      console.log(`✅ Extension ID found via service workers: ${extensionId}`);
      await page.close();
      return { context, extensionId };
    }

    await page.close();

    // Debug info
    console.error('❌ Could not find extension ID using any method');
    console.error('Debug info:', {
      cdpTargets: targets.targetInfos.map(t => ({ type: t.type, url: t.url })),
      backgroundPages: backgroundPages.length,
      serviceWorkers: workers.length,
    });

    throw new Error(
      '❌ Could not determine extension ID.\n\n' +
      '📋 Troubleshooting steps:\n' +
      '1. Load the extension manually in Chrome (chrome://extensions)\n' +
      '2. Check for errors in the extension (click "Errors" button)\n' +
      '3. Verify background.js loads without errors\n' +
      '4. Ensure manifest.json is valid\n\n' +
      '💡 Alternative: Use environment variable:\n' +
      '   $env:EXTENSION_ID="your-extension-id"\n' +
      '   npm run test:e2e\n\n' +
      `Extension path: ${extensionPath}`
    );

  } catch (error) {
    await page.close();
    throw error;
  }
}

/**
 * Opens the extension popup
 * @param {import('@playwright/test').BrowserContext} context
 * @param {string} extensionId
 * @returns {Promise<import('@playwright/test').Page>}
 */
async function openExtensionPopup(context, extensionId) {
  // Open a new page with the popup
  const popupPage = await context.newPage();
  await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
  await popupPage.waitForLoadState('domcontentloaded');

  // Wait extra time for jQuery/Bootstrap and form elements to load
  await popupPage.waitForTimeout(1500);

  return popupPage;
}

/**
 * Clears extension storage (useful for test cleanup)
 * Verifies storage is actually cleared
 * @param {import('@playwright/test').Page} popupPage
 */
async function clearExtensionStorage(popupPage) {
  // Clear storage
  await popupPage.evaluate(() => {
    return new Promise((resolve) => {
      chrome.storage.local.clear(() => {
        resolve();
      });
    });
  });

  // Verify storage is actually empty
  await popupPage.waitForTimeout(300);
  const data = await popupPage.evaluate(() => {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (items) => {
        resolve(items);
      });
    });
  });

  // If storage still has data, try clearing again
  if (Object.keys(data).length > 0) {
    console.warn('⚠️ Storage not empty after first clear, trying again...');
    await popupPage.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.clear(() => {
          resolve();
        });
      });
    });
    await popupPage.waitForTimeout(500);
  }
}

/**
 * Gets current session data from extension storage
 * @param {import('@playwright/test').Page} popupPage
 * @returns {Promise<any>}
 */
async function getSessionData(popupPage) {
  return await popupPage.evaluate(() => {
    return new Promise((resolve) => {
      chrome.storage.local.get(['session'], (result) => {
        resolve(result.session || null);
      });
    });
  });
}

/**
 * Waits for storage to update after an action
 * @param {import('@playwright/test').Page} popupPage
 * @param {number} timeout
 */
async function waitForStorageUpdate(popupPage, timeout = 2000) {
  await popupPage.waitForTimeout(timeout);
}

/**
 * Takes a screenshot with the extension
 * @param {import('@playwright/test').Page} testPage - The page where you want to take screenshot
 * @param {import('@playwright/test').Page} popupPage - The popup page
 * @param {string} type - Type of annotation ('bug', 'note', 'idea', 'question')
 */
async function takeScreenshotWithExtension(testPage, popupPage, type = 'bug') {
  // Focus on the test page
  await testPage.bringToFront();

  // Take screenshot via extension (simulating the screenshot button click)
  await popupPage.bringToFront();

  // Click the appropriate screenshot button based on type
  const screenshotButtonId = `#screenshot${type.charAt(0).toUpperCase() + type.slice(1)}`;
  await popupPage.click(screenshotButtonId);

  // Wait for screenshot to be taken and processed
  await waitForStorageUpdate(popupPage, 1000);
}

/**
 * Injects the content script into a page manually
 * This is needed for testing crop functionality on test pages where
 * the content script doesn't auto-inject due to manifest permissions
 * @param {import('@playwright/test').Page} page - The page to inject into
 * @returns {Promise<boolean>} - True if injection successful
 */
async function injectContentScript(page) {
  const path = require('path');
  const fs = require('fs');

  const scriptPath = path.join(__dirname, '../../../js/content_script.js');

  try {
    const contentScriptCode = fs.readFileSync(scriptPath, 'utf-8');

    // Inject the content script
    await page.addScriptTag({ content: contentScriptCode });

    // Wait for initialization
    await page.waitForTimeout(500);

    // Verify it loaded
    const isLoaded = await page.evaluate(() => {
      return typeof window.exploratoryTestingCropperInitialized !== 'undefined';
    });

    console.log(`Content script injection: ${isLoaded ? 'SUCCESS' : 'FAILED'}`);
    return isLoaded;
  } catch (error) {
    console.error('Failed to inject content script:', error.message);
    return false;
  }
}

module.exports = {
  launchBrowserWithExtension,
  openExtensionPopup,
  clearExtensionStorage,
  getSessionData,
  waitForStorageUpdate,
  takeScreenshotWithExtension,
  injectContentScript,
};
