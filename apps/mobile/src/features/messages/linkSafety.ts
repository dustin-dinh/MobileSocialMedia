/**
 * Links in chat messages: find them (to make them tappable) and flag the ones
 * that look like phishing. Pure functions, no network: a warning, never a block.
 * The server blocks every link from strangers and hidden anonymous senders
 * (apps/api/src/modules/moderation/text-safety.ts); its short-link hosts are
 * in SHORTENERS too, so both sides agree on what is risky.
 */

// Domain endings the server also treats as links when written without http(s).
const SUFFIXES = 'com|vn|net|org|io|me|xyz|top|info|link|ly|co|app|site|online|shop|club|cc|tk|biz|live|vip';
const LINK_PATTERN = new RegExp(
  `(?:https?:\\/\\/|www\\.)[^\\s]+|\\b(?:[a-z0-9-]+\\.)+(?:${SUFFIXES})\\b(?:\\/[^\\s]*)?`,
  'gi',
);
// Punctuation that ends a sentence rather than the link: "xem ở abc.com." -> "abc.com".
const TRAILING = /[.,!?;:)\]}'"…]+$/;

/** URL shorteners and links that move the chat to another app (hide where a link goes). */
const SHORTENERS = [
  'bit.ly', 'tinyurl.com', 'shorturl.at', 'shorturl.asia', 't.co', 'goo.gl', 'is.gd', 'v.gd', 'cutt.ly',
  'rebrand.ly', 'ow.ly', 'tiny.cc', 'rb.gy', 's.id', 'bom.so', 't.ly', 't.me', 'zalo.me', 'wa.me',
];

/**
 * Vietnamese banks and e-wallets scammers imitate, with their real domains.
 * shortcut: a fixed list; the buyer should confirm the domains and add brands they see in reports.
 */
const BRANDS: Record<string, string[]> = {
  agribank: ['agribank.com.vn'],
  bidv: ['bidv.com.vn'],
  mbbank: ['mbbank.com.vn'],
  momo: ['momo.vn'],
  sacombank: ['sacombank.com.vn'],
  shopeepay: ['shopeepay.vn'],
  techcombank: ['techcombank.com', 'techcombank.com.vn'],
  tpbank: ['tpb.vn', 'tpbank.vn'],
  vietcombank: ['vietcombank.com.vn'],
  vietinbank: ['vietinbank.vn'],
  vnpay: ['vnpay.vn'],
  vpbank: ['vpbank.com.vn'],
  zalopay: ['zalopay.vn'],
};

export type TextPart = { text: string; url?: string };

/** The message split into plain text and links, in order. */
export function splitLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;

  // A copy: a global pattern keeps its position between calls.
  const pattern = new RegExp(LINK_PATTERN);
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    const start = match.index;
    const url = match[0].replace(TRAILING, '');

    // "ten@gmail.com" is an email address, not a link.
    if (!url.includes('.') || text[start - 1] === '@') {
      continue;
    }

    if (start > last) {
      parts.push({ text: text.slice(last, start) });
    }

    parts.push({ text: url, url });
    last = start + url.length;
  }

  if (last < text.length) {
    parts.push({ text: text.slice(last) });
  }

  return parts;
}

/** What `Linking.openURL` gets: links written without a scheme open over https. */
export function toOpenableUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

const isUnder = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

// Digits and letter pairs that pass for letters at a glance: "vietc0mbank", "rnomo".
function unmask(host: string): string {
  return host
    .replace(/[-.]/g, '')
    .replace(/rn/g, 'm')
    .replace(/vv/g, 'w')
    .replace(/0/g, 'o')
    .replace(/1/g, 'l')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't');
}

/**
 * True when a link has a common phishing sign: plain http, a raw IP address,
 * an internationalised (punycode or non-Latin) host, a "user@" part that hides
 * the real host, a URL shortener, or a name that imitates a bank or e-wallet
 * from a domain that is not theirs.
 */
export function isSuspiciousLink(url: string): boolean {
  const match = /^(?:(https?):\/\/)?([^/?#]*)/i.exec(url.trim());
  const scheme = match?.[1]?.toLowerCase();
  const authority = match?.[2] ?? '';

  if (scheme === 'http' || authority.includes('@')) {
    return true;
  }

  const host = authority.replace(/:\d+$/, '').replace(/\.$/, '').toLowerCase();

  if (
    !host ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
    host.startsWith('[') ||
    // eslint-disable-next-line no-control-regex
    /[^\x00-\x7f]/.test(host) ||
    host.split('.').some((label) => label.startsWith('xn--')) ||
    SHORTENERS.some((domain) => isUnder(host, domain))
  ) {
    return true;
  }

  const plain = unmask(host);

  return Object.entries(BRANDS).some(
    ([brand, domains]) => plain.includes(brand) && !domains.some((domain) => isUnder(host, domain)),
  );
}
