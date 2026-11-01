/**
 * The app's one palette ("accent ladder", taste-skill app style): one brand hue,
 * raspberry #CC2F6E, at full strength only on small marks (the primary button,
 * the active tab, a like, an unread count); its pale tints carry every area
 * (selected rows, badges, the request bar). Everything else is ink and greys.
 * The ground is a pale tint of the hue, one clear step below white, so posts
 * and rows separate by tone alone and page and tints read as one family.
 * Every text colour reaches 4.5:1 on the surface it sits on.
 */
export interface ColorPalette {
  /** Page ground, behind lists and between blocks. */
  canvas: string;
  /** Blocks on the ground: posts, list rows, sheets. */
  surface: string;
  /** Same as surface; kept for older call sites. */
  surfaceHigh: string;
  /** One tone step off the ground: wells, pressed rows, neutral chips. */
  surfaceWell: string;
  /** 1px edges of cards and controls at rest. */
  border: string;
  /** Row rules inside lists, one step lighter than border. */
  rule: string;
  /** Borders of inputs and outlined buttons, one step darker than border. */
  control: string;
  text: string;
  textSecondary: string;
  /** Meta text: times, counts, labels. Still 4.5:1 on the ground. */
  caption: string;
  tabBarBg: string;
  tabBarIcon: string;
  tabBarIconActive: string;
  /** The brand hue: small marks only. */
  primary: string;
  primaryPressed: string;
  /** Palest tint: selected rows, accent pills, request bar. */
  primarySoft: string;
  /** Mid tint: progress tracks, selected borders. */
  primaryTrack: string;
  /** Dark ink of the hue, for text on primarySoft. */
  primaryInk: string;
  onPrimary: string;
  liked: string;
  saved: string;
  success: string;
  error: string;
  errorPressed: string;
  errorBg: string;
  errorInk: string;
  warningBg: string;
  warningBorder: string;
  warningInk: string;
}

export const palette: ColorPalette = {
  canvas: '#F6F1F3',
  surface: '#FFFFFF',
  surfaceHigh: '#FFFFFF',
  surfaceWell: '#EEE7EA',
  border: '#ECE4E7',
  rule: '#F3EEF0',
  control: '#D8CDD2',
  text: '#141414',
  textSecondary: '#5F5A5D',
  caption: '#6B6467',
  // White, so the brand-hue active label keeps 5:1 (it is 4.48:1 on the ground).
  tabBarBg: '#FFFFFF',
  tabBarIcon: '#6B6467',
  tabBarIconActive: '#CC2F6E',
  primary: '#CC2F6E',
  primaryPressed: '#A82459',
  primarySoft: '#FDF1F5',
  primaryTrack: '#F7D9E5',
  primaryInk: '#7A1D44',
  onPrimary: '#FFFFFF',
  // One hue family: a like is the brand hue, a save is ink.
  liked: '#CC2F6E',
  saved: '#141414',
  success: '#247B50',
  error: '#C4242A',
  errorPressed: '#A11D22',
  errorBg: '#FFEDEA',
  errorInk: '#831C1E',
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
  warningInk: '#92400E',
};
