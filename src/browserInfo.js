export async function getSystemInfo() {
    let brand = '';
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

            const brands = highEntropy.fullVersionList || [];

            // Find Chromium's version to use as reference for the real browser version
            const chromiumEntry = brands.find(b => b.brand === 'Chromium');
            const chromiumMajor = chromiumEntry ? chromiumEntry.version.split('.')[0] : null;

            // Real browser brand: not Chromium, and has the same major version as Chromium
            const significantBrand = brands.find(b =>
                b.brand !== 'Chromium' &&
                chromiumMajor !== null &&
                b.version.split('.')[0] === chromiumMajor
            );

            if (significantBrand) {
                brand = significantBrand.brand;
                browserVersion = significantBrand.version;
            } else if (chromiumEntry) {
                brand = 'Chrome';
                browserVersion = chromiumEntry.version;
            }

            osVersion = highEntropy.platformVersion || '';
            model = highEntropy.model || '';
        } catch (e) {
            const brands = navigator.userAgentData.brands || [];
            const chromiumEntry = brands.find(b => b.brand === 'Chromium');
            const chromiumMajor = chromiumEntry ? chromiumEntry.version : null;
            const significantBrand = brands.find(b =>
                b.brand !== 'Chromium' && b.version === chromiumMajor
            );
            if (significantBrand) {
                brand = significantBrand.brand;
                browserVersion = significantBrand.version;
            } else if (chromiumEntry) {
                brand = 'Chrome';
                browserVersion = chromiumEntry.version;
            }
        }
    }

    return {
        brand,
        model,
        browserVersion,
        os,
        osVersion
    };
}
