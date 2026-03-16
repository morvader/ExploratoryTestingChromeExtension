import { getSystemInfo } from '../../src/browserInfo';

describe('getSystemInfo', () => {
  let systemInfo;

  beforeAll(async () => {
    systemInfo = await getSystemInfo();
  });

  it('should return an object', () => {
    expect(typeof systemInfo).toBe('object');
    expect(systemInfo).not.toBeNull();
  });

  it('should contain all expected keys', () => {
    expect(systemInfo).toHaveProperty('brand');
    expect(systemInfo).toHaveProperty('model');
    expect(systemInfo).toHaveProperty('browserVersion');
    expect(systemInfo).toHaveProperty('os');
    expect(systemInfo).toHaveProperty('osVersion');
  });

  it('should retrieve real browser brand (not Chromium or fake brand)', () => {
    expect(systemInfo.brand).toBe('Google Chrome');
    expect(systemInfo.brand).not.toBe('Chromium');
  });

  it('should retrieve full browser version matching Chromium version', () => {
    expect(systemInfo.browserVersion).toBe('122.0.6261.112');
  });

  it('should retrieve OS platform from userAgentData', () => {
    expect(systemInfo.os).toBe('Windows');
  });

  it('should retrieve OS version from userAgentData high entropy values', () => {
    expect(systemInfo.osVersion).toBe('10.0');
  });

  it('should not include screenResolution, language, timezone or cookies', () => {
    expect(systemInfo).not.toHaveProperty('screenResolution');
    expect(systemInfo).not.toHaveProperty('language');
    expect(systemInfo).not.toHaveProperty('timezone');
    expect(systemInfo).not.toHaveProperty('cookies');
  });
});
