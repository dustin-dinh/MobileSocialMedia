/**
 * Share links ("Copy link" on posts and profiles, the link inside the system
 * share sheet). Hidden until the app has a web domain with App Links /
 * Universal Links: a `mobilesocial://` link only opens on a phone that already
 * has the app. Opening such links (navigation `linking`) stays active either way.
 *
 * Set `EXPO_PUBLIC_SHARE_LINKS_ENABLED=true` in `.env.local` to show them.
 */
export const SHARE_LINKS_ENABLED = process.env.EXPO_PUBLIC_SHARE_LINKS_ENABLED === 'true';
