export async function getSystemInfo() {
    let brand = 'Chrome';
    let model = '';
    let browserVersion = '';
    let os = '';
    let osVersion = '';

    if (navigator.userAgentData) {
        os = navigator.userAgentData.platform || '';

        try {
            const highEntropy = await navigator.userAgentData.getHighEntropyValues([
                'fullVersionList',
                'platformVersion',
                'model'
            ]);

            const brands = highEntropy.fullVersionList || navigator.userAgentData.brands || [];
            const significantBrand = brands.find(b =>
                !b.brand.includes('Not A') && b.brand !== 'Chromium'
            );
            if (significantBrand) {
                brand = significantBrand.brand;
                browserVersion = significantBrand.version;
            }

            osVersion = highEntropy.platformVersion || '';
            model = highEntropy.model || '';
        } catch (e) {
            const brands = navigator.userAgentData.brands || [];
            const significantBrand = brands.find(b =>
                !b.brand.includes('Not A') && b.brand !== 'Chromium'
            );
            if (significantBrand) {
                brand = significantBrand.brand;
                browserVersion = significantBrand.version;
            }
        }
    }

    return {
        brand,
        model,
        browserVersion,
        os,
        osVersion,
        screenResolution: `${screen.width} × ${screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookies: navigator.cookieEnabled
    };
}
