const path = require('path');
const babelRuntimeDir = path.dirname(
  require.resolve('@babel/runtime/package.json', {
    paths: [require.resolve('babel-preset-expo')],
  })
).replace(/\\/g, '/');

module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@babel/runtime/(.*)$': `${babelRuntimeDir}/$1`,
  },
  transformIgnorePatterns: [
    '[\\\\/]node_modules[\\\\/](?!(\\.pnpm[\\\\/]|(jest-)?react-native|@react-native|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|phosphor-react-native|react-native-svg))',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
