# Repository Rules

- Keep changes within the requested scope and preserve existing implementation.
- Follow the repository's confirmed framework, package manager, and conventions.
- Do not add dependencies, API assumptions, or architecture without a clear need.
- Keep Mobile and backend responsibilities separate unless a task explicitly requires coordination.

## AI / Codex Change Tracking Rule

1. AI agents must read `RULE.md` before modifying the repository.
2. AI agents must inspect the existing implementation before creating new files.
3. AI agents must not modify code outside the requested scope without a clear reason.
4. Every meaningful repository modification must be documented in `docs/change.md`.
5. `docs/change.md` must never be erased or regenerated; existing history must be preserved.
6. Before reporting a task as complete, the AI must update `docs/change.md`.
7. Architectural decisions that affect other developers must also be recorded in `docs/decisions.md`.
8. If an API contract is assumed but not confirmed, do not invent it.
9. Backend, API, and database architecture must not be changed by Dev A's AI agent without coordination.
10. Existing code takes precedence over assumptions in prompts.

## Cross-Platform Rule (Android + iOS)

The app ships on **both Android and iOS**. Every change, plan and recommendation must work on both. This rule is binding for every developer and every AI agent, in every tool.

1. **Both platforms or it is not done.** A mobile feature, fix or UI change is complete only when it works on Android and on iOS. Never deliver something that works on one platform and breaks, crashes or is missing on the other.
2. **No platform-only APIs without a counterpart.** Do not use Android-only or iOS-only APIs (`ToastAndroid`, `PermissionsAndroid`, `BackHandler`-only flows, `ActionSheetIOS`, `android_ripple`, bare `elevation`, …) unless the other platform gets equivalent behaviour in the same change. Prefer cross-platform React Native / Expo APIs.
3. **Platform differences are isolated and explained.** When behaviour must differ, use `Platform.select` / `Platform.OS` or `.ios.tsx` / `.android.tsx` files, and say why in a one-line comment. Never leave a branch for only one platform.
4. **Dependencies must support both platforms** and the project's Expo SDK. Check before adding one; install with `expo install`. A library that needs native code must be configured for both platforms (config plugin, permissions, credentials).
5. **Permissions come in pairs.** A feature that needs a device permission (photos, camera, notifications, location, …) must declare the iOS usage description and the Android permission in `app.json` in the same change. A missing iOS usage description crashes the app.
6. **`app.json` stays valid for both.** Keep `ios.bundleIdentifier` and `android.package`, icons and splash for both, and deep-link scheme handling on both.
7. **Layout must hold on both.** Use safe-area insets (notch, home indicator, Android navigation bar), `KeyboardAvoidingView` with the right behaviour per platform, and no layout that assumes one platform's status-bar height, font metrics or screen ratio. Shadows must render on both (not `elevation` alone).
8. **Networking must work in a release build on both.** No hard-coded emulator or LAN addresses (`10.0.2.2`, `192.168.x.x`) in code. Production traffic is HTTPS (iOS blocks plain HTTP).
9. **Store rules are requirements.** Anything the App Store or Google Play requires counts as part of the feature: e.g. third-party sign-in on iOS needs Sign in with Apple, user-generated content needs report and block, accounts need in-app deletion.
10. **Push, sign-in and other native services need both sides** (APNs and FCM, iOS and Android OAuth clients). If only one side can be set up now, the other is listed as open work, not silently skipped.
11. **Say what was actually tested.** Every report and every `docs/change.md` entry for a mobile change states which platforms it was run on (for example "Android emulator: yes, iPhone: not run"). Never write or imply "works on both" for a platform that was not run. "Not verified on iOS" is an acceptable statement; a false "done" is not.
12. **Exceptions need the project owner.** If something truly cannot work on one platform, stop, explain the limitation and the options, and record the owner's decision in `docs/decisions.md` before shipping it.

Backend changes are covered when they affect either client: an API or configuration that only one platform can use (a push provider, an OAuth audience, a link format) follows the same rule.
