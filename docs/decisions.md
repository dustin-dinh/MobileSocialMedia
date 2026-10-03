# Technical Decisions

## DEC-001 - Use feature-based organization for Mobile source

Date: 2026-09-13

Status: Accepted

### Context

The Mobile MVP contains several domains, including authentication, feed, posts, profile, search, and notifications. The project needs a structure that lets Dev A add each domain without concentrating all logic in one screen or file.

### Decision

Organize Mobile source under `apps/mobile/src/features/` by product feature, while keeping reusable UI, services, navigation, and shared types in application-wide directories.

### Reason

This matches the requested Mobile ownership boundaries and keeps feature-specific UI close to its feature while avoiding duplicated shared code.

### Consequences

- New feature behavior should be added to the relevant feature directory.
- Reusable components should not be placed inside an unrelated feature.
- The structure does not prescribe a framework or dependency until the Mobile toolchain is confirmed.

### Related Files

- `apps/mobile/src/`
- `apps/mobile/README.md`
- `docs/summary.md`

## DEC-002 - Use React Native + Expo + TypeScript for Mobile

Date: 2026-09-13

Status: Accepted

### Context

Phase 1 confirmed that the repository had no runnable Mobile application. The MVP has a four-week delivery window, targets Android, and needs a maintainable Mobile structure without custom native requirements or navigation work during bootstrap.

### Decision

Use a managed React Native application with Expo SDK 57 and TypeScript in `apps/mobile/`. Use pnpm 12.4.1 through Corepack for Mobile dependencies. Start from Expo's blank TypeScript shape with a thin `index.ts` entry point and a foundation component in `src/App.tsx`.

### Reason

Expo reduces initial Android setup work while retaining React Native and TypeScript for the planned Mobile architecture. The blank template avoids introducing navigation before Phase 2.

### Consequences

- Native Android and iOS folders are not committed during this managed Expo bootstrap.
- The application can be started with Expo and validated through TypeScript and Android JavaScript bundle export.
- Future non-secret API configuration will use Expo's `EXPO_PUBLIC_` environment-variable convention only after an API contract is agreed.
- Authentication, navigation, and API integration remain out of scope for this phase.

### Related Files

- `apps/mobile/package.json`
- `apps/mobile/app.json`
- `apps/mobile/index.ts`
- `apps/mobile/src/App.tsx`
- `apps/mobile/tsconfig.json`
- `apps/mobile/pnpm-lock.yaml`

## DEC-003 - Use React Navigation for Mobile navigation

Date: 2026-09-13

Status: Accepted

### Context

Phase 2 needs a typed Mobile navigation foundation that supports future authentication state switching and the five MVP top-level destinations without building product behavior or introducing a routing framework beyond the application's needs.

### Decision

Use React Navigation 7 in `apps/mobile/`: `@react-navigation/native` for the navigation container, `@react-navigation/native-stack` for Splash/Login/Register, and `@react-navigation/bottom-tabs` for Home/Search/Create/Notifications/Profile. Keep route parameter lists centralized in `src/navigation/types.ts`.

### Reason

React Navigation supports the managed Expo application and provides the native stack and bottom-tab primitives required by the agreed navigation hierarchy. It avoids an unnecessary filesystem router, global state library, icon dependency, or UI framework.

### Consequences

- `App.tsx` remains a small composition root rather than holding route configuration.
- The temporary root navigation mode is isolated in `RootNavigator` and must be replaced by real session bootstrap in Phase 5.
- Placeholder screens remain feature-owned until their relevant product phases add behavior.
- Navigation routes without parameters use `undefined`; future parameters should be added only when a confirmed feature requires them.

### Related Files

- `apps/mobile/src/App.tsx`
- `apps/mobile/src/navigation/`
- `apps/mobile/src/features/*/screens/`
- `apps/mobile/package.json`

## DEC-004 - Use a minimal fetch-based Mobile HTTP boundary until Auth contracts are confirmed

Date: 2026-09-14

Status: Accepted

### Context

Phase 4 needs a reusable Mobile networking foundation, but this repository contains no confirmed Register, Login, or Logout method, URL, request/response shape, error contract, or token/session field. The application must be ready for integration without teaching screens speculative backend details.

### Decision

Use Expo's public `EXPO_PUBLIC_API_BASE_URL` convention through `src/config/api.ts`, a small shared JSON client built on the platform `fetch`, and normalized Mobile transport error categories. Keep Register, Login, and Logout behind a feature-owned Auth service that performs no request until Dev B confirms the contract.

### Reason

This avoids an unnecessary HTTP dependency while giving future Auth integration one place for base-URL, JSON, and basic transport-error handling. It keeps raw requests and backend shapes out of screens without inventing endpoints, response fields, or token behavior.

### Consequences

- Screens retain local validation and delegate valid submissions to the Auth service boundary.
- The service must map only confirmed API fields and call the shared client when a contract exists.
- Missing configuration, network failures, HTTP 401 responses, server responses, and unknown failures can be represented consistently on Mobile.
- Session persistence and authenticated navigation remain Phase 5 responsibilities.

### Related Files

- `apps/mobile/src/config/api.ts`
- `apps/mobile/src/services/apiError.ts`
- `apps/mobile/src/services/httpClient.ts`
- `apps/mobile/src/features/auth/services/authService.ts`

## DEC-005 - Prefer Expo LAN development with a documented tunnel fallback

Date: 2026-09-14

Status: Accepted

### Context

The Mobile app is developed and manually tested with BlueStacks and Expo Go SDK 57. LAN has worked reliably for local testing, while Expo tunnel has also worked but can disconnect intermittently. The project already has the Expo-compatible `@expo/ngrok` package installed locally to support tunnel transport.

### Decision

Use `expo start --lan` as the documented default development workflow. Keep `expo start --tunnel` as a fallback through the development-only `@expo/ngrok` dependency, exposed by simple `start:lan` and `start:tunnel` package scripts.

### Reason

LAN is the preferred local transport. Retaining the verified tunnel fallback gives developers a documented option when LAN discovery or routing is unavailable, without adding an application runtime dependency or platform automation.

### Consequences

- `@expo/ngrok` is intentionally tracked as a Mobile dev dependency and lockfile entry.
- Developers should use tunnel only when LAN is unavailable and should expect intermittent tunnel disconnects.
- BlueStacks-specific environment workarounds are documented as machine-local troubleshooting rather than committed system configuration.
- Expo Go APK downloads remain ignored local artifacts.

### Related Files

- `apps/mobile/package.json`
- `apps/mobile/pnpm-lock.yaml`
- `apps/mobile/README.md`
- `.gitignore`

## DEC-006 - Configure the Backend with NestJS, Prisma 7, and Supabase connection roles

Date: 2026-09-16

Status: Accepted

### Context

The shared Backend/Supabase guide requires a NestJS backend using Prisma with one Supabase development database. The repository had no Backend package or connection configuration.

### Decision

Create `apps/api/` as an independent pnpm package. Use NestJS configuration to read an untracked `.env`; use `DATABASE_URL` through one global `PrismaService` at runtime and `DIRECT_URL` only through `prisma.config.ts` for Prisma CLI commands. Start with no models or migrations.

### Consequences

- Secrets remain local and `.env.example` contains placeholders only.
- Database schema work requires Dev B approval and a new Prisma migration; direct Dashboard edits and `prisma db push` remain prohibited for the shared database.
- API contracts, Auth behavior, and Mobile integration remain pending; this configuration adds none of them.

### Related Files

- `apps/api/`
- `BACKEND_SUPABASE_COLLAB_GUIDE.md`
- `docs/api-contract.md`

## DEC-007 - Establish the initial User schema without a database migration

Date: 2026-09-16

Status: Accepted

### Context

The MVP needs a stable identity model before Auth and social-feature models can be designed. The repository has a confirmed Prisma/Supabase connection but no database model.

### Decision

Define the initial Prisma `User` model with a UUID primary key, unique `username` and `email`, required `passwordHash`, optional profile fields (`displayName`, `avatarUrl`, `bio`), and creation/update timestamps. Do not create or apply a migration in this change.

### Consequences

- The model is only local schema source until Dev B creates a new migration.
- Later Auth endpoints must never return `passwordHash`.
- Future `Post`, `Follow`, `Like`, `Comment`, and `Notification` models will reference `User` in later, separately reviewed schema changes.

### Related Files

- `apps/api/prisma/schema.prisma`
- `docs/api-contract.md`

## DEC-008 - Persist the Mobile Auth session with Expo SecureStore

Date: 2026-09-21

Status: Accepted

### Context

The confirmed Week 1 Backend contract returns a JWT access token from Login and requires that token for Current User and Logout. Mobile needs to restore a valid session after an app restart without exposing the token to screens or adding a state-management library.

### Decision

Use the Expo-compatible `expo-secure-store` package to store only the access token. Keep session bootstrap, Login verification through `/users/me`, and Logout cleanup in the feature-owned `AuthSessionProvider` built with React Context. Retain the existing fetch-based HTTP client.

### Consequences

- The token is not hardcoded, committed, logged, or placed in React Navigation parameters.
- `App` renders `SplashScreen` before mounting a navigator while token validation is pending; `RootNavigator` chooses the authenticated or unauthenticated branch only after that work completes.
- Screens receive the authenticated user and actions through the Auth feature context; no new global state-management library is required.
- A future refresh-token or server-side revocation contract needs a reviewed update to this decision and the Auth service.

### Related Files

- `apps/mobile/package.json`
- `apps/mobile/src/features/auth/authSession.tsx`
- `apps/mobile/src/features/auth/services/authTokenStorage.ts`
- `apps/mobile/src/features/auth/services/authService.ts`

## DEC-009 - Render session Splash outside Mobile navigators

Date: 2026-09-21

Status: Accepted

### Context

The first session-bootstrap implementation reused `AuthNavigator` while changing its `initialRouteName` from Splash to Login. React Navigation treats `initialRouteName` as the route for the navigator's first load, so completing bootstrap did not replace the navigator's already-active Splash route.

### Decision

Render `SplashScreen` directly from `App` while `AuthSessionProvider` is bootstrapping. Mount `NavigationContainer` and `RootNavigator` only after bootstrap finishes. Keep `AuthNavigator` focused on Login and Register with a static Login initial route.

### Reason

This follows the React Navigation authentication-flow guidance to render Splash before navigators and avoids using an initialization-only navigator prop as mutable application state.

### Consequences

- A completed or timed-out session bootstrap always mounts the unauthenticated navigator at Login when no user is available.
- Splash is not a navigable Auth stack route and does not retain stale navigation state.
- Login, Logout, and authenticated tab transitions continue to switch complete navigator branches based on session state.

### Related Files

- `apps/mobile/src/App.tsx`
- `apps/mobile/src/navigation/RootNavigator.tsx`
- `apps/mobile/src/navigation/AuthNavigator.tsx`
- `apps/mobile/src/navigation/types.ts`

## DEC-010 - Establish Claymorphism Foundation (Deep Pink & Vanilla)

Date: 2026-09-30

Status: Accepted

### Context

The mobile application interface is being restyled to a soft, tactile Claymorphism aesthetic (deep pink brand accents + soothing vanilla backgrounds). The design requires strict WCAG AA contrast compliance, zero usage of pure `#FFFFFF` / `#000000` for background/text, reliable 3D shadows on React Native 0.86 with Android fallbacks, Nunito typography, and unified icon/emoji systems.

### Decision

1. Established centralized theme tokens under `src/theme/`:
   - `colors.ts`: canvas `#F5E8D5`, surface `#FBEFDD`, surfaceHigh `#FFF5E6`, surfaceWell `#EFDFC9`, primary `#CC2F6E`, primaryPressed `#A82459`, primarySoft `#F6CADB`, onPrimary `#FFF5E6`, text `#4A2A35`, textSecondary `#6E4B57`, border `#E6D2BA`, liked `#E0457B`, saved `#E3A02E`, success `#4E9F7D`, error `#C8413B`, errorBg `#F8D9D3`.
   - Tuned caption token from `#85606C` to `#7E5763` to ensure WCAG AA >= 4.5:1 on canvas `#F5E8D5` (measured 4.72:1).
2. Provided dual-layer `boxShadow` with multi-platform fallback in `clay.ts`: outer soft dark shadow + top-left light shadow, with inner highlight simulated via top-lip border for consistent appearance on Android and BlueStacks.
3. Created presentation primitives in `src/components/ui/`: `ClaySurface`, `ClayButton`, `ClayInput`, and `ClayText`. All buttons enforce `minTouchTarget >= 44px` and mandatory `accessibilityLabel`.
4. Centralized icons in `ClayIcon` (wrapping `phosphor-react-native`) and 3D emojis in `ClayEmoji` with PNG assets sourced from Microsoft Fluent UI Emoji repository (MIT License, https://github.com/microsoft/fluentui-emoji).
5. Retargeted all six feature theme files (`authTheme.ts`, `commentTheme.ts`, `feedTheme.ts`, `notificationsTheme.ts`, `profileTheme.ts`, `searchTheme.ts`) to central theme tokens while strictly preserving all existing exported identifiers.

### Consequences

- All UI components inherit consistent clay elevation, colors, and typography.
- Existing business logic and services remain 100% untouched.
- Screen imports of existing theme files continue to function without breakage.

### Related Files

- `apps/mobile/src/theme/*`
- `apps/mobile/src/components/ui/*`
- `apps/mobile/src/components/icons/*`
- `apps/mobile/src/features/*/`
- `apps/mobile/src/App.tsx`

## DEC-011 - Floating Clay Pill Tab Bar & Synchronized Screen Headers

Date: 2026-09-30

Status: Accepted

### Context

The application navigation chrome previously used default React Navigation styling: a native unstyled bottom tab bar without icons, and a default native header on Home while all other screens hid the header. The Claymorphism restyle requires an organic, floating pill tab bar with Phosphor icons, a raised center action button, and cohesive screen headers.

### Decision

1. Created `ClayTabBar.tsx` implementing a floating `ClaySurface` pill (`borderRadius: 999`, bottom inset via `useSafeAreaInsets()`).
2. Configured Phosphor icons for each tab: `House` (Home), `MagnifyingGlass` (Search), `Plus` (Create), `Bell` (Notifications), and `User` (Profile). Inactive tabs use `duotone` weight with caption color; active tabs use `fill` weight with primary pink color.
3. Designed the center Create tab as an elevated circular button (`54x54`, `ClaySurface` raisedPrimary with `Plus` icon) for clear visual hierarchy.
4. Set `headerShown: false` globally on `MainTabNavigator` and integrated a synchronized custom Clay header in `HomeScreen` with `ClayText` title, safe-area top inset, and vanilla background matching Search and Notifications.

### Consequences

- Tab bar floats gracefully across different screen aspect ratios and gesture navigation bars.
- Home header layout is visually unified with all other tabs.

### Related Files

- `apps/mobile/src/navigation/ClayTabBar.tsx`
- `apps/mobile/src/navigation/MainTabNavigator.tsx`
- `apps/mobile/src/features/feed/screens/HomeScreen.tsx`

## DEC-012 - Claymorphism Feed & Post Presentation

Date: 2026-09-30

Status: Accepted

### Context

Feed posts in `PostCard` previously used standard card styling with hardcoded black drop shadows, Unicode characters (`♥`, `♡`, `💬`, `↗`, `★`, `☆`, `•••`) for interactive actions, and system fonts. The feed empty state rendered an unstyled Unicode emoji `📭`.

### Decision

1. Converted `PostCard` to use a `ClaySurface` card container (`borderRadius: 28`) on a soft vanilla background.
2. Sourced action icons exclusively from `ClayIcon` with Phosphor primitives (`Heart`, `ChatCircle`, `ShareNetwork`, `BookmarkSimple`, `DotsThree`). Active like/bookmark states toggle between `fill` and `duotone` weights with custom semantic tokens (`liked` `#E0457B`, `saved` `#E3A02E`).
3. Replaced raw Unicode `📭` in `FeedEmptyState` with `ClayEmoji` rendering the 3D Fluent `sparkles_3d.png` asset.
4. Enforced >= 44px accessible touch areas and explicit accessibility labels on all post action buttons.

### Consequences

- Eliminates all Unicode/emoji character icons from the feed.
- Action row provides tactile spring feedback while keeping feed data logic, like toggling, and comment navigation intact.

### Related Files

- `apps/mobile/src/features/feed/components/PostCard.tsx`
- `apps/mobile/src/features/feed/components/FeedEmptyState.tsx`
- `apps/mobile/src/features/feed/screens/HomeScreen.tsx`

## DEC-013 - Claymorphism Create Post & Comment System Presentation

Date: 2026-09-30

Status: Accepted

### Context

Creating posts and viewing/adding comments previously used unstyled text inputs, raw Unicode characters (`✕`, `🖼`, `↑`, `💬`, `♥`, `♡`), and generic modal backgrounds. They required restyling into inset clay wells and raised clay sheets with Phosphor iconography.

### Decision

1. In `CreateScreen`, wrapped the text input in an inset `ClaySurface` (`surfaceWell` background with reversed inner shadows), replaced toolbar icons with Phosphor `Image` and `X`, and modernized the submit button with `ClayButton`.
2. In `CommentModal`, styled the bottom sheet with `ClaySurface` modal variant, applied a warm dark berry backdrop (`rgba(74,42,53,0.45)`), restyled empty comments with 3D `speech_balloon_3d.png` via `ClayEmoji`, and used Phosphor `ArrowUp` for submission.
3. In `CommentItem`, replaced Unicode `♥`/`♡` with `ClayIcon name="Heart"`, integrated clay avatar halos, and set touch targets >= 44px.

### Consequences

- All interactive controls now provide tactile inset/raised depth while keeping event dispatching (`feedEvents.emit`), image picking, and comment mutations unchanged.

### Related Files

- `apps/mobile/src/features/post/screens/CreateScreen.tsx`
- `apps/mobile/src/features/comment/components/CommentModal.tsx`
- `apps/mobile/src/features/comment/components/CommentItem.tsx`

## DEC-014 - Claymorphism Search & Notifications System Presentation

Date: 2026-09-30

Status: Accepted

### Context

Search and Notifications screens featured generic flat gray styling, hardcoded hex values (`#EEF2F6`, `#E2E8F0`, `#3B82F6`, `#FFFFFF`), and raw Unicode characters for icons and states (`🔍`, `♥`, `💬`, `👤`, `✨`, `🔔`).

### Decision

1. In `SearchScreen`, upgraded the search field to an inset `ClaySurface` with Phosphor `MagnifyingGlass` and clear button `X`.
2. In `UserSearchCard`, converted avatar halos and follow buttons to `ClayButton` with >= 44px touch targets.
3. In `SearchSkeleton` and `NotificationSkeleton`, unified bone placeholders into warm vanilla/pink tokens (`surfaceWell` and `border`) with zero raw gray hexes.
4. In `SearchEmptyState` and `NotificationEmptyState`, replaced Unicode emojis with 3D Fluent `magnifying_glass`, `sparkles`, and `bell` assets via `ClayEmoji`.
5. In `NotificationItem`, replaced Unicode badges with Phosphor `Heart`, `ChatCircle`, and `User` through `ClayIcon`, converted unread rows to `surfaceUnread` (`surfaceHigh`), and styled the follow back button with >= 44px touch area.
6. In `NotificationsScreen`, added safe-area padding and 100px bottom clearance to prevent floating tab bar occlusion.

### Consequences

- Completely eliminates legacy hexes and Unicode icons across Search and Notifications.
- All touch targets comply with WCAG accessibility guidelines.

### Related Files

- `apps/mobile/src/features/search/screens/SearchScreen.tsx`
- `apps/mobile/src/features/search/components/UserSearchCard.tsx`
- `apps/mobile/src/features/search/components/SearchSkeleton.tsx`
- `apps/mobile/src/features/search/components/SearchEmptyState.tsx`
- `apps/mobile/src/features/notifications/screens/NotificationsScreen.tsx`
- `apps/mobile/src/features/notifications/components/NotificationItem.tsx`
- `apps/mobile/src/features/notifications/components/NotificationSkeleton.tsx`
- `apps/mobile/src/features/notifications/components/NotificationEmptyState.tsx`

## DEC-015 - Claymorphism Profile & Modals Presentation

Date: 2026-09-30

Status: Accepted

### Context

The Profile experience (`ProfileScreen`, `ProfileHeader`, `EditProfileModal`, `ProfileEmptyPosts`) utilized flat standard controls, unstyled inputs, raw Unicode emojis (`✍️`), and lacked proper clearance for the floating pill tab bar.

### Decision

1. In `ProfileHeader`, enclosed the 96px avatar with a 3-layer clay halo, converted the stats bar into a raised `ClaySurface`, and replaced buttons with `ClayButton` ensuring >= 44px hit areas.
2. In `EditProfileModal`, styled the bottom sheet with `ClaySurface` modal variant, applied a warm berry backdrop (`rgba(74,42,53,0.45)`), and converted text inputs to inset `ClaySurface` wells with Nunito typography.
3. In `ProfileEmptyPosts`, replaced raw Unicode `✍️` with 3D `memo_3d.png` via `ClayEmoji` and action trigger with `ClayButton`.
4. In `ProfileScreen`, integrated safe-area top insets and 100px bottom list clearance to prevent floating tab bar occlusion.

### Consequences

- All Profile surfaces now share the consistent Claymorphism aesthetic without hardcoded gray/white hexes.
- All interactive controls adhere to WCAG >= 44px touch targets and full accessibility labels.

### Related Files

- `apps/mobile/src/features/profile/screens/ProfileScreen.tsx`
- `apps/mobile/src/features/profile/components/ProfileHeader.tsx`
- `apps/mobile/src/features/profile/components/EditProfileModal.tsx`
- `apps/mobile/src/features/profile/components/ProfileEmptyPosts.tsx`

## DEC-016 - Multi-Palette Architecture, Tab Bar Clipping, and Render Performance Optimization

Date: 2026-09-30

Status: Accepted

### Context

Following the initial Claymorphism restyle, three visual issues and potential performance bottlenecks required resolution:
1. Need for multiple swappable palettes (`blush`, `paper`, `ink`) with a single switchable constant.
2. A subtle, flat horizontal white streak appeared above the floating pill tab bar.
3. Custom fonts (`Nunito`) silently fell back to system Roboto on Android when coupled with `fontWeight`.
4. Render performance in deep FlatLists needed optimization through shadow tier reduction (`full` vs `lite`), component memoization, and batching.

### Decision

1. **Multi-Palette Structure:**
   - Consolidated palettes in `src/theme/palettes.ts` with identical token schemas across `blush`, `paper`, and `ink`.
   - Used a runtime `Proxy` in `src/theme/colors.ts` accessing `ACTIVE_PALETTE` to eliminate circular dependency deadlocks with typography.
   - For paper and ink palettes, permitted `#FFFFFF` exclusively for `surface`, `surfaceHigh`, `onPrimary`, and `tabBarBg`. Pure `#000000` remains forbidden across all palettes.
2. **Tab Bar White Streak Elimination:**
   - Identified that the 2px fallback top-highlight lip in `ClaySurface.tsx` lacked container border-radius clipping and projected past the 32px pill radius.
   - Disabled the highlight lip entirely on `pill` and `lite` variants; enclosed it inside an inner container with `overflow: 'hidden'` and `borderRadius: radius` for standard cards/modals.
3. **Android Font Resolution:**
   - Removed all `fontWeight` pairings with custom font families.
   - Extended `ClayText` with a `weight` prop directly resolving specific family variants (`Nunito_400Regular`, `Nunito_600SemiBold`, `Nunito_700Bold`, `Nunito_800ExtraBold`).
4. **Render Performance:**
   - Established `full` (up to 4 shadow layers) for primary landmarks and `lite` (<= 2 layers with Android elevation 2) for all FlatList items (`PostCard`, `CommentItem`, `NotificationItem`, `UserSearchCard`, skeletons).
   - Wrapped list items in `React.memo` with stable callbacks (`useCallback`) and static stylesheets.
   - Adopted `expo-image` with `cachePolicy="memory-disk"` and constrained dimensions.
   - Added batching controls (`initialNumToRender={6}`, `maxToRenderPerBatch={6}`, `windowSize={7}`) across all FlatLists.
   - Added `apps/mobile/__tests__/perf.test.tsx` using `React.Profiler` to verify zero re-renders of memoized items during unrelated parent updates.

### Consequences

- Developers can toggle between 3 polished palettes by editing a single line in `src/theme/index.ts`.
- Tab bar pill renders an organic curved outline with zero white artifact bleed.
- Android devices resolve Nunito bold weights natively without font fallback.
- FlatList scrolling overhead and GPU layer pressure are significantly curtailed.

### Related Files

- `apps/mobile/src/theme/palettes.ts`
- `apps/mobile/src/theme/index.ts`
- `apps/mobile/src/theme/colors.ts`
- `apps/mobile/src/components/ui/ClaySurface.tsx`
- `apps/mobile/src/components/ui/ClayText.tsx`
- `apps/mobile/src/features/feed/components/PostCard.tsx`
- `apps/mobile/scripts/verify-ui.mjs`
- `apps/mobile/__tests__/perf.test.tsx`
- `docs/perf-notes.md`
- `docs/change.md`
- `docs/decisions.md`


