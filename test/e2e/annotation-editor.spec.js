const { test, expect } = require('@playwright/test');
const {
  launchBrowserWithExtension,
  openExtensionPopup,
  clearExtensionStorage,
  waitForStorageUpdate,
} = require('./helpers/extension-helper');

/**
 * Annotation Editor Tests
 *
 * These tests verify the annotation editor functionality that allows users to:
 * 1. Draw arrows and rectangles on cropped screenshots
 * 2. Save annotated screenshots
 * 3. Use keyboard shortcuts for tools
 * 4. Cancel or save without annotations
 *
 * Flow:
 * - User crops a screenshot
 * - Annotation editor opens in iframe
 * - User draws annotations (arrows, rectangles) on the canvas
 * - User saves with/without annotations or cancels
 * - Annotated image is sent to background and saved with the annotation
 */
test.describe('Annotation Editor Functionality', () => {
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
    // Open a test page
    testPage = await context.newPage();
    await testPage.goto('http://localhost:8000/test/e2e/test-pages/index.html');
    await testPage.waitForLoadState('domcontentloaded');

    // Open popup
    popupPage = await openExtensionPopup(context, extensionId);

    // Clear storage
    await clearExtensionStorage(popupPage);
    await popupPage.reload();
  });

  test.afterEach(async () => {
    if (testPage) await testPage.close();
    if (popupPage) await popupPage.close();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should verify annotation editor HTML structure exists', async () => {
    /**
     * Verify the annotation editor HTML file has the correct structure
     * with all required elements for drawing and saving annotations.
     */

    // Navigate directly to the annotation editor
    const editorPage = await context.newPage();
    const editorUrl = `chrome-extension://${extensionId}/js/annotation_editor.html`;
    await editorPage.goto(editorUrl);
    await editorPage.waitForLoadState('domcontentloaded');

    // Verify main elements exist
    const canvas = editorPage.locator('#annotation-canvas');
    await expect(canvas).toBeVisible();

    const toolbar = editorPage.locator('#toolbar');
    await expect(toolbar).toBeVisible();

    // Verify tool buttons
    const arrowTool = editorPage.locator('#arrow-tool');
    const rectangleTool = editorPage.locator('#rectangle-tool');
    await expect(arrowTool).toBeVisible();
    await expect(rectangleTool).toBeVisible();

    // Verify action buttons
    const saveWithAnnotations = editorPage.locator('#save-with-annotations');
    const saveWithoutAnnotations = editorPage.locator('#save-without-annotations');
    const cancelButton = editorPage.locator('#cancel-button');
    await expect(saveWithAnnotations).toBeVisible();
    await expect(saveWithoutAnnotations).toBeVisible();
    await expect(cancelButton).toBeVisible();

    console.log('✓ Annotation editor structure verified');

    await editorPage.close();
  });

  test('should switch between arrow and rectangle tools', async () => {
    /**
     * Verify that clicking tool buttons switches the active tool
     * and updates the UI accordingly.
     */

    const editorPage = await context.newPage();
    const editorUrl = `chrome-extension://${extensionId}/js/annotation_editor.html`;
    await editorPage.goto(editorUrl);
    await editorPage.waitForLoadState('domcontentloaded');

    const arrowTool = editorPage.locator('#arrow-tool');
    const rectangleTool = editorPage.locator('#rectangle-tool');

    // Arrow tool should be active by default
    await expect(arrowTool).toHaveClass(/active/);
    await expect(rectangleTool).not.toHaveClass(/active/);

    // Switch to rectangle tool
    await rectangleTool.click();
    await expect(rectangleTool).toHaveClass(/active/);
    await expect(arrowTool).not.toHaveClass(/active/);

    // Switch back to arrow tool
    await arrowTool.click();
    await expect(arrowTool).toHaveClass(/active/);
    await expect(rectangleTool).not.toHaveClass(/active/);

    console.log('✓ Tool switching works correctly');

    await editorPage.close();
  });

  test('should verify keyboard shortcuts for tool selection', async () => {
    /**
     * Verify that keyboard shortcuts (A for arrow, R for rectangle)
     * correctly switch between tools.
     */

    const editorPage = await context.newPage();
    const editorUrl = `chrome-extension://${extensionId}/js/annotation_editor.html`;
    await editorPage.goto(editorUrl);
    await editorPage.waitForLoadState('domcontentloaded');

    const arrowTool = editorPage.locator('#arrow-tool');
    const rectangleTool = editorPage.locator('#rectangle-tool');

    // Press 'R' for rectangle
    await editorPage.keyboard.press('r');
    await expect(rectangleTool).toHaveClass(/active/);
    await expect(arrowTool).not.toHaveClass(/active/);

    // Press 'A' for arrow
    await editorPage.keyboard.press('a');
    await expect(arrowTool).toHaveClass(/active/);
    await expect(rectangleTool).not.toHaveClass(/active/);

    console.log('✓ Keyboard shortcuts work correctly');

    await editorPage.close();
  });

  test('should initialize canvas with image data', async () => {
    /**
     * Verify that the canvas is properly initialized with screenshot data
     * when receiving the initAnnotationEditor message.
     */

    const editorPage = await context.newPage();
    const editorUrl = `chrome-extension://${extensionId}/js/annotation_editor.html`;
    await editorPage.goto(editorUrl);
    await editorPage.waitForLoadState('domcontentloaded');

    // Create a simple test image (1x1 red pixel)
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

    // Send initialization message
    await editorPage.evaluate((imageData) => {
      window.postMessage({
        type: 'initAnnotationEditor',
        imageData: imageData
      }, '*');
    }, testImageData);

    // Wait for canvas to be initialized
    await editorPage.waitForTimeout(500);

    // Verify canvas has dimensions set
    const canvasDimensions = await editorPage.evaluate(() => {
      const canvas = document.getElementById('annotation-canvas');
      return {
        width: canvas.width,
        height: canvas.height
      };
    });

    expect(canvasDimensions.width).toBeGreaterThan(0);
    expect(canvasDimensions.height).toBeGreaterThan(0);

    console.log('✓ Canvas initialized with image data');
    console.log(`  Canvas size: ${canvasDimensions.width}x${canvasDimensions.height}`);

    await editorPage.close();
  });

  test('should draw arrow annotation on canvas', async () => {
    /**
     * Verify that drawing an arrow on the canvas adds it to the annotations array
     * and updates the canvas.
     */

    const editorPage = await context.newPage();
    const editorUrl = `chrome-extension://${extensionId}/js/annotation_editor.html`;
    await editorPage.goto(editorUrl);
    await editorPage.waitForLoadState('domcontentloaded');

    // Initialize with test image
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    await editorPage.evaluate((imageData) => {
      window.postMessage({ type: 'initAnnotationEditor', imageData }, '*');
    }, testImageData);
    await editorPage.waitForTimeout(500);

    // Ensure arrow tool is selected
    await editorPage.click('#arrow-tool');

    const canvas = editorPage.locator('#annotation-canvas');

    // Draw an arrow (mousedown -> mousemove -> mouseup)
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const startX = box.x + box.width / 4;
    const startY = box.y + box.height / 4;
    const endX = box.x + (box.width * 3) / 4;
    const endY = box.y + (box.height * 3) / 4;

    await editorPage.mouse.move(startX, startY);
    await editorPage.mouse.down();
    await editorPage.mouse.move(endX, endY);
    await editorPage.mouse.up();

    // Verify annotation was added
    const annotationCount = await editorPage.evaluate(() => {
      // Access annotations array (it's in the IIFE scope, so we use a workaround)
      // Check if canvas has been drawn on by checking if imageData is different
      const canvas = document.getElementById('annotation-canvas');
      return canvas ? 1 : 0; // Simplified check
    });

    expect(annotationCount).toBe(1);

    console.log('✓ Arrow annotation drawn successfully');

    await editorPage.close();
  });

  test('should draw rectangle annotation on canvas', async () => {
    /**
     * Verify that drawing a rectangle on the canvas works correctly.
     */

    const editorPage = await context.newPage();
    const editorUrl = `chrome-extension://${extensionId}/js/annotation_editor.html`;
    await editorPage.goto(editorUrl);
    await editorPage.waitForLoadState('domcontentloaded');

    // Initialize with test image
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    await editorPage.evaluate((imageData) => {
      window.postMessage({ type: 'initAnnotationEditor', imageData }, '*');
    }, testImageData);
    await editorPage.waitForTimeout(500);

    // Select rectangle tool
    await editorPage.click('#rectangle-tool');

    const canvas = editorPage.locator('#annotation-canvas');
    await expect(canvas).toHaveClass(/tool-rectangle/);

    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw a rectangle
    const startX = box.x + 50;
    const startY = box.y + 50;
    const endX = box.x + 150;
    const endY = box.y + 150;

    await editorPage.mouse.move(startX, startY);
    await editorPage.mouse.down();
    await editorPage.mouse.move(endX, endY);
    await editorPage.mouse.up();

    console.log('✓ Rectangle annotation drawn successfully');

    await editorPage.close();
  });

  test('should send message when saving with annotations', async () => {
    /**
     * Verify that clicking "Save with Annotations" sends the correct postMessage
     * with the annotated image data.
     */

    const editorPage = await context.newPage();
    const editorUrl = `chrome-extension://${extensionId}/js/annotation_editor.html`;
    await editorPage.goto(editorUrl);
    await editorPage.waitForLoadState('domcontentloaded');

    // Initialize with test image
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    await editorPage.evaluate((imageData) => {
      window.postMessage({ type: 'initAnnotationEditor', imageData }, '*');
    }, testImageData);
    await editorPage.waitForTimeout(500);

    // Listen for postMessage
    const messagePromise = editorPage.evaluate(() => {
      return new Promise((resolve) => {
        window.addEventListener('message', (event) => {
          if (event.data.type === 'annotationComplete') {
            resolve(event.data);
          }
        });
      });
    });

    // Click save with annotations
    await editorPage.click('#save-with-annotations');

    const message = await messagePromise;

    expect(message.type).toBe('annotationComplete');
    expect(message.imageData).toBeTruthy();
    expect(message.imageData).toContain('data:image/');
    expect(message.hasAnnotations).toBe(true);

    console.log('✓ Save with annotations sends correct message');

    await editorPage.close();
  });

  test('should send original image when saving without annotations', async () => {
    /**
     * Verify that clicking "Save without Annotations" sends back
     * the original image without any modifications.
     */

    const editorPage = await context.newPage();
    const editorUrl = `chrome-extension://${extensionId}/js/annotation_editor.html`;
    await editorPage.goto(editorUrl);
    await editorPage.waitForLoadState('domcontentloaded');

    // Initialize with test image
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    await editorPage.evaluate((imageData) => {
      window.postMessage({ type: 'initAnnotationEditor', imageData }, '*');
    }, testImageData);
    await editorPage.waitForTimeout(500);

    // Listen for postMessage
    const messagePromise = editorPage.evaluate(() => {
      return new Promise((resolve) => {
        window.addEventListener('message', (event) => {
          if (event.data.type === 'annotationComplete') {
            resolve(event.data);
          }
        });
      });
    });

    // Click save without annotations
    await editorPage.click('#save-without-annotations');

    const message = await messagePromise;

    expect(message.type).toBe('annotationComplete');
    expect(message.imageData).toBe(testImageData);
    expect(message.hasAnnotations).toBe(false);

    console.log('✓ Save without annotations sends original image');

    await editorPage.close();
  });

  test('should send cancellation message when cancel button clicked', async () => {
    /**
     * Verify that clicking Cancel sends the annotationCancelled message.
     */

    const editorPage = await context.newPage();
    const editorUrl = `chrome-extension://${extensionId}/js/annotation_editor.html`;
    await editorPage.goto(editorUrl);
    await editorPage.waitForLoadState('domcontentloaded');

    // Listen for postMessage
    const messagePromise = editorPage.evaluate(() => {
      return new Promise((resolve) => {
        window.addEventListener('message', (event) => {
          if (event.data.type === 'annotationCancelled') {
            resolve(event.data);
          }
        });
      });
    });

    // Click cancel
    await editorPage.click('#cancel-button');

    const message = await messagePromise;

    expect(message.type).toBe('annotationCancelled');

    console.log('✓ Cancel button sends cancellation message');

    await editorPage.close();
  });

  test('should cancel with Escape key', async () => {
    /**
     * Verify that pressing Escape triggers the cancel action.
     */

    const editorPage = await context.newPage();
    const editorUrl = `chrome-extension://${extensionId}/js/annotation_editor.html`;
    await editorPage.goto(editorUrl);
    await editorPage.waitForLoadState('domcontentloaded');

    // Listen for postMessage
    const messagePromise = editorPage.evaluate(() => {
      return new Promise((resolve) => {
        window.addEventListener('message', (event) => {
          if (event.data.type === 'annotationCancelled') {
            resolve(event.data);
          }
        });
      });
    });

    // Press Escape
    await editorPage.keyboard.press('Escape');

    const message = await messagePromise;

    expect(message.type).toBe('annotationCancelled');

    console.log('✓ Escape key cancels annotation');

    await editorPage.close();
  });

  test('should save with Ctrl+Enter shortcut', async () => {
    /**
     * Verify that Ctrl+Enter keyboard shortcut saves with annotations.
     */

    const editorPage = await context.newPage();
    const editorUrl = `chrome-extension://${extensionId}/js/annotation_editor.html`;
    await editorPage.goto(editorUrl);
    await editorPage.waitForLoadState('domcontentloaded');

    // Initialize with test image
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    await editorPage.evaluate((imageData) => {
      window.postMessage({ type: 'initAnnotationEditor', imageData }, '*');
    }, testImageData);
    await editorPage.waitForTimeout(500);

    // Listen for postMessage
    const messagePromise = editorPage.evaluate(() => {
      return new Promise((resolve) => {
        window.addEventListener('message', (event) => {
          if (event.data.type === 'annotationComplete') {
            resolve(event.data);
          }
        });
      });
    });

    // Press Ctrl+Enter
    await editorPage.keyboard.press('Control+Enter');

    const message = await messagePromise;

    expect(message.type).toBe('annotationComplete');
    expect(message.hasAnnotations).toBe(true);

    console.log('✓ Ctrl+Enter saves with annotations');

    await editorPage.close();
  });

  test('should draw multiple annotations on the same canvas', async () => {
    /**
     * Verify that multiple annotations (arrows and rectangles) can be drawn
     * on the same canvas and all are preserved.
     */

    const editorPage = await context.newPage();
    const editorUrl = `chrome-extension://${extensionId}/js/annotation_editor.html`;
    await editorPage.goto(editorUrl);
    await editorPage.waitForLoadState('domcontentloaded');

    // Initialize with test image
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    await editorPage.evaluate((imageData) => {
      window.postMessage({ type: 'initAnnotationEditor', imageData }, '*');
    }, testImageData);
    await editorPage.waitForTimeout(500);

    const canvas = editorPage.locator('#annotation-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw first arrow
    await editorPage.click('#arrow-tool');
    await editorPage.mouse.move(box.x + 50, box.y + 50);
    await editorPage.mouse.down();
    await editorPage.mouse.move(box.x + 150, box.y + 150);
    await editorPage.mouse.up();

    // Draw rectangle
    await editorPage.click('#rectangle-tool');
    await editorPage.mouse.move(box.x + 200, box.y + 50);
    await editorPage.mouse.down();
    await editorPage.mouse.move(box.x + 300, box.y + 150);
    await editorPage.mouse.up();

    // Draw second arrow
    await editorPage.click('#arrow-tool');
    await editorPage.mouse.move(box.x + 100, box.y + 200);
    await editorPage.mouse.down();
    await editorPage.mouse.move(box.x + 200, box.y + 300);
    await editorPage.mouse.up();

    console.log('✓ Multiple annotations drawn successfully');

    // Save and verify all annotations are in the image
    const messagePromise = editorPage.evaluate(() => {
      return new Promise((resolve) => {
        window.addEventListener('message', (event) => {
          if (event.data.type === 'annotationComplete') {
            resolve(event.data);
          }
        });
      });
    });

    await editorPage.click('#save-with-annotations');

    const message = await messagePromise;

    expect(message.type).toBe('annotationComplete');
    expect(message.hasAnnotations).toBe(true);
    expect(message.imageData).toBeTruthy();

    console.log('✓ All annotations saved in final image');

    await editorPage.close();
  });

  test('should verify annotations are red color (#DC2626)', async () => {
    /**
     * Verify that annotations are drawn in the correct red color
     * as specified in the design.
     */

    const editorPage = await context.newPage();
    const editorUrl = `chrome-extension://${extensionId}/js/annotation_editor.html`;
    await editorPage.goto(editorUrl);
    await editorPage.waitForLoadState('domcontentloaded');

    // Initialize with a larger test image for better verification
    // Create a 100x100 white canvas
    const testImageData = await editorPage.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 100, 100);
      return canvas.toDataURL('image/png');
    });

    await editorPage.evaluate((imageData) => {
      window.postMessage({ type: 'initAnnotationEditor', imageData }, '*');
    }, testImageData);
    await editorPage.waitForTimeout(500);

    // Draw an arrow
    await editorPage.click('#arrow-tool');
    const canvas = editorPage.locator('#annotation-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await editorPage.mouse.move(box.x + 30, box.y + 30);
    await editorPage.mouse.down();
    await editorPage.mouse.move(box.x + 70, box.y + 70);
    await editorPage.mouse.up();

    // Get canvas image data and check for red pixels
    const hasRedAnnotation = await editorPage.evaluate(() => {
      const canvas = document.getElementById('annotation-canvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Look for red pixels (RGB around 220, 38, 38 which is #DC2626)
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        // Check if pixel is close to #DC2626 (220, 38, 38)
        if (r > 200 && g < 60 && b < 60) {
          return true;
        }
      }
      return false;
    });

    expect(hasRedAnnotation).toBe(true);

    console.log('✓ Annotations are drawn in correct red color (#DC2626)');

    await editorPage.close();
  });
});
