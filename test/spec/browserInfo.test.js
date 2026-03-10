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
    expect(systemInfo).toHaveProperty('screenResolution');
    expect(systemInfo).toHaveProperty('language');
    expect(systemInfo).toHaveProperty('timezone');
    expect(systemInfo).toHaveProperty('cookies');
  });

  it('should retrieve browser brand from userAgentData', () => {
    expect(systemInfo.brand).toBe('Google Chrome');
  });

  it('should retrieve full browser version from userAgentData', () => {
    expect(systemInfo.browserVersion).toBe('122.0.6261.112');
  });

  it('should retrieve OS platform from userAgentData', () => {
    expect(systemInfo.os).toBe('Windows');
  });

  it('should retrieve OS version from userAgentData high entropy values', () => {
    expect(systemInfo.osVersion).toBe('10.0');
  });

  it('should retrieve screen resolution from screen dimensions', () => {
    expect(systemInfo.screenResolution).toBe('1920 × 1080');
  });

  it('should retrieve language from navigator.language', () => {
    expect(systemInfo.language).toBe('es-ES');
  });

  it('should retrieve timezone from Intl', () => {
    expect(systemInfo.timezone).toBe('Europe/Madrid');
  });

  it('should retrieve cookie status from navigator.cookieEnabled', () => {
    expect(systemInfo.cookies).toBe(true);
  });
});
