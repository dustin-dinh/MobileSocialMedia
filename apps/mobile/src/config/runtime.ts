/**
 * Single switch between the live NestJS API and the in-memory mock layer.
 *
 * The app talks to the real backend by default. Set
 * `EXPO_PUBLIC_USE_MOCK=true` (in `.env.local`, then restart Expo) to run
 * fully offline on mock data with the login screen bypassed — this is what
 * the Jest suite and the adb QA scripts rely on.
 */
export const USE_MOCK_API = process.env.EXPO_PUBLIC_USE_MOCK === 'true';
