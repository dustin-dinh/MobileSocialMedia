/* eslint-env jest */

// Mock expo-font
jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
}));

// Mock @expo-google-fonts/nunito
jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: jest.fn(() => [true]),
  Nunito_400Regular: 'Nunito_400Regular',
  Nunito_500Medium: 'Nunito_500Medium',
  Nunito_600SemiBold: 'Nunito_600SemiBold',
  Nunito_600SemiBold_Italic: 'Nunito_600SemiBold_Italic',
  Nunito_700Bold: 'Nunito_700Bold',
  Nunito_800ExtraBold: 'Nunito_800ExtraBold',
  Nunito_900Black: 'Nunito_900Black',
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true })),
  MediaTypeOptions: { Images: 'Images' },
}));

// Mock expo-image
jest.mock('expo-image', () => {
  const React = require('react');
  return {
    Image: (props) => React.createElement('Image', props),
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const actual = jest.requireActual('react-native-safe-area-context');
  const insets = { top: 44, left: 0, right: 0, bottom: 34 };
  const frame = { x: 0, y: 0, width: 375, height: 812 };

  return {
    ...actual,
    useSafeAreaInsets: jest.fn(() => insets),
    useSafeAreaFrame: jest.fn(() => frame),
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children, style }) => React.createElement('View', { style }, children),
    SafeAreaInsetsContext: {
      Consumer: ({ children }) => children(insets),
      Provider: ({ children }) => children,
    },
  };
});

// Mock useAuthSession hook
jest.mock('./src/features/auth/authSession', () => {
  const actual = jest.requireActual('./src/features/auth/authSession');
  return {
    ...actual,
    useAuthSession: jest.fn(() => ({
      user: { id: 'user-1', username: 'testuser', displayName: 'Test User' },
      accessToken: 'mock-token',
      isLoading: false,
      signIn: jest.fn(() => Promise.resolve()),
      signUp: jest.fn(() => Promise.resolve()),
      signOut: jest.fn(() => Promise.resolve()),
    })),
  };
});
