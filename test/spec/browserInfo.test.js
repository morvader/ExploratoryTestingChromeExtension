import { getSystemInfo } from '../../src/browserInfo';

describe('getSystemInfo', () => {
  let systemInfo;

  beforeAll(() => {
    // getSystemInfo relies on global mocks set in jest.setup.js
    // We can call it once if the global mocks are static for these tests
    systemInfo = getSystemInfo();
  });

  it('should return an object', () => {
    expect(typeof systemInfo).toBe('object');
    expect(systemInfo).not.toBeNull();
  });

  it('should contain all expected keys', () => {
    expect(systemInfo).toHaveProperty('browser');
    expect(systemInfo).toHaveProperty('browserVersion');
    expect(systemInfo).toHaveProperty('os');
    expect(systemInfo).toHaveProperty('osVersion');
    expect(systemInfo).toHaveProperty('cookies');
    expect(systemInfo).toHaveProperty('flashVersion');
  });

  it('should retrieve browser name correctly', () => {
    expect(systemInfo.browser).toBe('Chrome'); // Hardcoded in function
  });

  it('should retrieve browser version from chrome.runtime.getManifest', () => {
    // Assuming jest.setup.js mocks chrome.runtime.getManifest().version to '1.0.0'
    expect(systemInfo.browserVersion).toBe('1.0.0');
  });

  it('should retrieve OS platform from navigator.platform', () => {
    // Assuming jest.setup.js mocks navigator.platform to 'TestPlatform'
    expect(systemInfo.os).toBe('TestPlatform');
  });

  it('should retrieve OS version from navigator.userAgent', () => {
    // Assuming jest.setup.js mocks navigator.userAgent to 'TestUserAgent/1.0'
    // The function extracts this specifically, so the test should reflect that.
    // If getSystemInfo is more complex, this might need adjustment.
    // For now, assuming it directly uses navigator.userAgent for osVersion.
    expect(systemInfo.osVersion).toBe('TestUserAgent/1.0');
  });

  it('should retrieve cookie status from navigator.cookieEnabled', () => {
    // Assuming jest.setup.js mocks navigator.cookieEnabled to true
    expect(systemInfo.cookies).toBe(true);
  });

  it('should report Flash version as N/A', () => {
    expect(systemInfo.flashVersion).toBe('N/A'); // Hardcoded in function
  });
});
