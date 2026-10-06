const path = require('path');

// The unit suite runs against the in-memory mock layer, never the network.
// LIVE_API=1 (see __tests__/live/) opts into the real backend instead.
process.env.EXPO_PUBLIC_USE_MOCK = process.env.LIVE_API === '1' ? 'false' : 'true';
const babelRuntimeDir = path.dirname(
  require.resolve('@babel/runtime/package.json', {
    paths: [require.resolve('babel-preset-expo')],
  })
).replace(/\\/g, '/');

module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@babel/runtime/(.*)$': `${babelRuntimeDir}/$1`,
    '^phosphor-react-native/lib/module/icons/(.*)$': '<rootDir>/node_modules/phosphor-react-native/lib/commonjs/icons/$1.js',
  },
  transformIgnorePatterns: [
    '[\\\\/]node_modules[\\\\/](?!(\\.pnpm[\\\\/]|(jest-)?react-native|@react-native|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|phosphor-react-native|react-native-svg))',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Helper module for the live suite, not a test file.
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/live/nodeFetch\\.ts$'],
};
