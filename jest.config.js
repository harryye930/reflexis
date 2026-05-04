// Jest is set up only for unit-testing the pure-ish helpers under src/lib.
// The Next.js app itself isn't covered — we'd want next/jest for that, and
// none of the Firebase-tied components have stable behaviour without a
// running backend. Keep this minimal until that changes.
module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.js'],
  transform: {
    '^.+\\.jsx?$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }]] }]
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
  // Avoid pulling Next.js / Firebase noise into the test classpath.
  testPathIgnorePatterns: ['/node_modules/', '/.next/']
};
