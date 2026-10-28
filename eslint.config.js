const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    ignores: [
      'lib/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
      '**/*.min.js',
      'HTMLReport/TableFilter/**',
    ],
  },
  js.configs.recommended,
  {
    // Extension runtime: ES modules running in the browser or service worker
    files: ['src/**/*.js', 'js/**/*.js', 'background.js', 'HTMLReport/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
        chrome: 'readonly',
        $: 'readonly',
        jQuery: 'readonly',
        // vendored libraries loaded via <script> tags
        JSZip: 'readonly',
        Chart: 'readonly',
        CanvasJS: 'readonly',
        TableFilter: 'readonly',
        driver: 'readonly',
      },
    },
  },
  {
    // Tooling and tests run in Node (CommonJS)
    files: ['*.config.js', 'jest.setup.js', 'scripts/**/*.js', 'test/e2e/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      // e2e specs reference window/document/chrome inside page.evaluate()
      globals: { ...globals.node, ...globals.browser, ...globals.jest, chrome: 'writable' },
    },
  },
  {
    // Jest specs are ES modules transpiled by babel-jest
    files: ['test/spec/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser, ...globals.jest, chrome: 'writable' },
    },
  },
  {
    // Builds an HTML document inside a template literal; the escaped closing script tag is intentional
    files: ['HTMLReport/modules/reportDownload.js'],
    rules: { 'no-useless-escape': 'off' },
  },
  {
    rules: {
      // Unused callback params are common in chrome.* listeners
      // Dead-store noise in legacy code; reported but not blocking
      'no-useless-assignment': 'warn',
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
    },
  },
  prettier,
];
