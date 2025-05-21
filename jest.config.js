module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: ['src/**/*.js'],

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ['./jest.setup.js'],

  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/test/spec/**/*.test.js', // Updated to match new .test.js extension
  ],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    // If you have module aliases in your project, configure them here
    // Example: '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Transform files with babel-jest if using ES6+ features not supported by Node version
  // Jest often handles basic ES6 module syntax (import/export) out of the box.
  // If advanced ES6+ features or JSX are used, Babel might be needed.
  // For now, we assume Jest's default transformation will work for the current codebase.
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
};
