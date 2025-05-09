export function getSystemInfo() {
    return {
        browser: "Chrome",
        browserVersion: chrome.runtime.getManifest().version,
        os: navigator.platform,
        osVersion: navigator.userAgent,
        cookies: navigator.cookieEnabled,
        flashVersion: "N/A" // Flash ya no se usa en navegadores modernos
    };
} 