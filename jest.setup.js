// Mock chrome extension APIs
global.chrome = {
  runtime: {
    getManifest: () => ({ version: '1.0.0' }), // Basic mock
    // Add other chrome.runtime APIs if needed by tests
  },
  // Mock other chrome.* APIs as necessary
  storage: {
    local: {
      get: jest.fn((keys, callback) => callback({})),
      set: jest.fn((items, callback) => callback()),
      // Add other chrome.storage.local methods if used
    },
    // Add chrome.storage.sync etc. if used
  },
  tabs: {
    query: jest.fn((queryInfo, callback) => callback([{ id: 1, url: 'http://example.com' }])),
    // Add other chrome.tabs APIs if needed
  }
  // Add more chrome API mocks as identified during testing
};

// Mock navigator properties used in browserInfo.js
global.navigator = {
  ...global.navigator, // Preserve existing navigator properties if any
  platform: 'TestPlatform',
  userAgent: 'TestUserAgent/1.0',
  cookieEnabled: true,
};


// Attempt to load the custom date.js library.
// IMPORTANT: This path is relative to the project root.
// Ensure 'lib/date.js' exists and this path is correct.
// If 'lib/date.js' modifies Date.prototype, it should apply globally once imported.
try {
  require('./lib/date.js'); // This assumes date.js is CJS compatible or Jest handles its format.
                           // If it's an ES module and causes issues, this might need adjustment
                           // or the date logic refactored.
} catch (e) {
  console.error("Failed to load lib/date.js in jest.setup.js:", e);
  // Depending on test failures, we might need to reconsider how to handle this.
}
