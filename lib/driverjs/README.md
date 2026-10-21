# Driver.js (bundled)

- Library: [Driver.js](https://driverjs.com/) 1.10.2, MIT license (see `license`).
- Files: `driver.js.iife.js` and `driver.css`, copied unmodified from `dist/` of the `driver.js@1.10.2` npm package.
- Used by `tutorial.html` / `js/tutorial.js`. It is bundled instead of loaded from a CDN so the extension makes no external requests.

To upgrade, download the new package version, copy the same two files and `license`, update the version above, and run `npm run test:e2e -- test/e2e/tutorial.spec.js`.
