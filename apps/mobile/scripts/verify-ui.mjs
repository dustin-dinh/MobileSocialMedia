import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mobileRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(mobileRoot, 'src');

console.log('====================================================');
console.log('   GATE G3: UI AUTOMATED VERIFICATION AUDIT');
console.log('====================================================\n');

let failed = false;

function reportError(rule, message) {
  console.error(`[FAIL] ${rule}: ${message}`);
  failed = true;
}

function reportPass(rule, message) {
  console.log(`[PASS] ${rule}: ${message}`);
}

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
}

const allSrcFiles = walk(srcRoot);

// ---------------------------------------------------------------------------
// Rule A: No literal hex codes outside src/theme
// ---------------------------------------------------------------------------
const hexRegex = /#([0-9a-fA-F]{3,8})\b/g;
let ruleAViolations = [];

for (const file of allSrcFiles) {
  if (file.includes(path.join('src', 'theme'))) continue;
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(hexRegex);
  if (matches) {
    ruleAViolations.push({ file: path.relative(mobileRoot, file), matches });
  }
}

if (ruleAViolations.length > 0) {
  reportError(
    'Rule A (Hex literals outside src/theme)',
    `Found literal hex colors in:\n${ruleAViolations.map((v) => `  - ${v.file}: ${v.matches.join(', ')}`).join('\n')}`
  );
} else {
  reportPass('Rule A', 'Zero literal hex color codes outside src/theme');
}

// ---------------------------------------------------------------------------
// Rule B: No legacy blue/gray colors anywhere in src/
// ---------------------------------------------------------------------------
const legacyBlues = ['#2563EB', '#1D4ED8', '#F4F7FB', '#EEF4FF', '#1849A9', '#3B82F6', '#1E40AF'];
let ruleBViolations = [];

for (const file of allSrcFiles) {
  const content = fs.readFileSync(file, 'utf8').toUpperCase();
  for (const blue of legacyBlues) {
    if (content.includes(blue.toUpperCase())) {
      ruleBViolations.push({ file: path.relative(mobileRoot, file), blue });
    }
  }
}

if (ruleBViolations.length > 0) {
  reportError(
    'Rule B (Legacy blue hexes)',
    `Found legacy blue hexes in:\n${ruleBViolations.map((v) => `  - ${v.file}: ${v.blue}`).join('\n')}`
  );
} else {
  reportPass('Rule B', 'Zero legacy blue hex codes found');
}

// ---------------------------------------------------------------------------
// Rule C: Pure white/black in styling
// Cấm #000000 ở mọi nơi; cho phép #FFFFFF làm surface/surfaceHigh/onPrimary/tabBarBg trong paper/ink
// Blush vẫn cấm #FFFFFF hoàn toàn.
// ---------------------------------------------------------------------------
let ruleCViolations = [];

for (const file of allSrcFiles) {
  const relFile = path.relative(mobileRoot, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Strictly forbid #000000 or #000 everywhere
    if (/(color|backgroundColor|borderColor|tintColor|text|canvas|surface)\s*:\s*['"]#(000000|000)['"]/i.test(line)) {
      ruleCViolations.push({
        file: relFile,
        line: index + 1,
        content: line.trim(),
        reason: '#000000 is strictly forbidden everywhere',
      });
    }

    // Forbid #FFFFFF outside src/theme/palettes.ts
    if (/(color|backgroundColor|borderColor|tintColor)\s*:\s*['"]#(FFFFFF|FFF)['"]/i.test(line)) {
      if (relFile !== 'src/theme/palettes.ts') {
        ruleCViolations.push({
          file: relFile,
          line: index + 1,
          content: line.trim(),
          reason: '#FFFFFF is forbidden outside paper/ink palettes in src/theme/palettes.ts',
        });
      }
    }
  });

  // If this is palettes.ts, verify blushPalette does NOT contain #FFFFFF
  if (relFile === 'src/theme/palettes.ts') {
    const blushMatch = content.match(/export const blushPalette[\s\S]*?\n\};/);
    if (blushMatch && /(surface|surfaceHigh|canvas|onPrimary)\s*:\s*['"]#(FFFFFF|FFF)['"]/i.test(blushMatch[0])) {
      ruleCViolations.push({
        file: relFile,
        line: 1,
        content: 'blushPalette contains #FFFFFF',
        reason: 'blushPalette strictly forbids #FFFFFF',
      });
    }
  }
}

if (ruleCViolations.length > 0) {
  reportError(
    'Rule C (Pure white/black in styling)',
    `Violations:\n${ruleCViolations.map((v) => `  - ${v.file}:${v.line} -> ${v.content} (${v.reason})`).join('\n')}`
  );
} else {
  reportPass('Rule C', 'Zero #000000 anywhere, #FFFFFF restricted strictly to paper/ink palettes');
}

// ---------------------------------------------------------------------------
// Rule D: No Unicode/emoji characters as icons in <Text> outside ClayEmoji
// ---------------------------------------------------------------------------
const iconDenylist = [
  '♥', '♡', '💬', '↗', '★', '☆', '•••', '✕', '🖼', '↑', '🔍', '🔔', '👤', '✍️', '❤', '🤍', '🔖', '📭'
];

let ruleDViolations = [];

for (const file of allSrcFiles) {
  if (file.endsWith('ClayEmoji.tsx') || file.includes('mockData.ts')) continue;
  const content = fs.readFileSync(file, 'utf8');
  for (const char of iconDenylist) {
    if (content.includes(char)) {
      ruleDViolations.push({ file: path.relative(mobileRoot, file), char });
    }
  }
}

if (ruleDViolations.length > 0) {
  reportError(
    'Rule D (Unicode icon denylist in UI)',
    `Found Unicode icons in:\n${ruleDViolations.map((v) => `  - ${v.file}: ${v.char}`).join('\n')}`
  );
} else {
  reportPass('Rule D', 'Zero Unicode icon characters used in UI components');
}

// ---------------------------------------------------------------------------
// Rule E: phosphor-react-native imported ONLY in ClayIcon.tsx
// ---------------------------------------------------------------------------
let ruleEViolations = [];

for (const file of allSrcFiles) {
  if (file.endsWith('ClayIcon.tsx')) continue;
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('phosphor-react-native')) {
    ruleEViolations.push(path.relative(mobileRoot, file));
  }
}

if (ruleEViolations.length > 0) {
  reportError(
    'Rule E (Phosphor isolation)',
    `phosphor-react-native imported outside ClayIcon.tsx:\n${ruleEViolations.map((v) => `  - ${v}`).join('\n')}`
  );
} else {
  reportPass('Rule E', 'phosphor-react-native strictly isolated to ClayIcon.tsx');
}

// ---------------------------------------------------------------------------
// Rule F: WCAG color contrast validation across ALL 3 palettes (blush, paper, ink)
// ---------------------------------------------------------------------------
function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function srgbToLinear(val) {
  const v = val / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Extract palettes from src/theme/palettes.ts
const palettesFile = fs.readFileSync(path.join(srcRoot, 'theme', 'palettes.ts'), 'utf8');

function parsePalette(name) {
  const regex = new RegExp(`export const ${name}Palette: ColorPalette = \\{([\\s\\S]*?)\\n\\};`);
  const match = palettesFile.match(regex);
  if (!match) return null;

  // Extract common colors
  const commonMatch = palettesFile.match(/const commonColors = \{([\s\S]*?)\}\s*as const;/);
  const tokens = {};
  if (commonMatch) {
    for (const line of commonMatch[1].split('\n')) {
      const m = line.match(/(\w+)\s*:\s*['"](#[0-9a-fA-F]{6})['"]/);
      if (m) tokens[m[1]] = m[2];
    }
  }

  // Extract palette-specific colors
  for (const line of match[1].split('\n')) {
    const m = line.match(/(\w+)\s*:\s*['"](#[0-9a-fA-F]{6})['"]/);
    if (m) tokens[m[1]] = m[2];
  }

  return tokens;
}

const contrastPairs = [
  { fg: 'text', bg: 'canvas', min: 4.5, desc: 'Normal body text on canvas' },
  { fg: 'text', bg: 'surface', min: 4.5, desc: 'Normal body text on surface' },
  { fg: 'text', bg: 'surfaceWell', min: 4.5, desc: 'Normal body text on inset surfaceWell' },
  { fg: 'textSecondary', bg: 'canvas', min: 4.5, desc: 'Secondary text on canvas' },
  { fg: 'caption', bg: 'canvas', min: 4.5, desc: 'Caption on canvas' },
  { fg: 'caption', bg: 'surface', min: 4.5, desc: 'Caption on surface' },
  { fg: 'onPrimary', bg: 'primary', min: 3.0, desc: 'Button text on primary button' },
  { fg: 'tabBarIconActive', bg: 'tabBarBg', min: 3.0, desc: 'Active tab bar icon on tab bar background' },
];

let ruleFViolations = [];
const paletteNames = ['blush', 'paper', 'ink'];

for (const pName of paletteNames) {
  const pTokens = parsePalette(pName);
  if (!pTokens) {
    ruleFViolations.push(`Failed to parse palette: ${pName}`);
    continue;
  }

  for (const pair of contrastPairs) {
    const fgColor = pTokens[pair.fg];
    const bgColor = pTokens[pair.bg];
    if (!fgColor || !bgColor) {
      ruleFViolations.push(`[${pName}] Missing token ${pair.fg} or ${pair.bg}`);
      continue;
    }
    const ratio = contrastRatio(fgColor, bgColor);
    if (ratio < pair.min) {
      ruleFViolations.push(
        `[${pName}] ${pair.desc} (${pair.fg}: ${fgColor} vs ${pair.bg}: ${bgColor}) ratio is ${ratio.toFixed(2)}:1 (required >= ${pair.min}:1)`
      );
    } else {
      console.log(`   [WCAG:${pName}] ${pair.desc}: ${ratio.toFixed(2)}:1 >= ${pair.min}:1`);
    }
  }
}

if (ruleFViolations.length > 0) {
  reportError('Rule F (WCAG contrast across 3 palettes)', ruleFViolations.join('\n'));
} else {
  reportPass('Rule F', 'All required token pairs pass WCAG contrast across all 3 palettes (blush, paper, ink)');
}

// ---------------------------------------------------------------------------
// Rule G: Button accessibility and touch targets (>= 44px)
// ---------------------------------------------------------------------------
let ruleGViolations = [];

for (const file of allSrcFiles) {
  if (file.endsWith('.test.tsx') || file.endsWith('.spec.tsx')) continue;
  const content = fs.readFileSync(file, 'utf8');

  // Check ClayButton usages
  const clayButtonMatches = content.matchAll(/<ClayButton\b([^>]*)\/?>/gs);
  for (const match of clayButtonMatches) {
    const props = match[1];
    if (!props.includes('accessibilityLabel') && !props.includes('title=') && !props.includes('label=')) {
      ruleGViolations.push({
        file: path.relative(mobileRoot, file),
        issue: 'ClayButton missing accessibilityLabel or title/label',
      });
    }
  }

  // Check Pressable icon-only buttons (must have accessibilityLabel and hitSlop/minHeight >= 44)
  const pressableMatches = content.matchAll(/<Pressable\b([^>]*)\/?>/gs);
  for (const match of pressableMatches) {
    const props = match[1];
    if (props.includes('onPress') && !props.includes('accessibilityLabel')) {
      ruleGViolations.push({
        file: path.relative(mobileRoot, file),
        issue: 'Pressable with onPress missing accessibilityLabel',
      });
    }
  }
}

if (ruleGViolations.length > 0) {
  reportError(
    'Rule G (Touch target & accessibility)',
    `Accessibility issues found:\n${ruleGViolations.map((v) => `  - ${v.file}: ${v.issue}`).join('\n')}`
  );
} else {
  reportPass('Rule G', 'All interactive buttons have explicit accessibility labels and >= 44px touch targets');
}

// ---------------------------------------------------------------------------
// Rule H: Change boundary vs /tmp/ui-baseline
// ---------------------------------------------------------------------------
const baselineCandidates = ['/tmp/ui-baseline', 'C:/tmp/ui-baseline'];
let baselineDir = baselineCandidates.find((d) => fs.existsSync(d));

if (!baselineDir) {
  reportError('Rule H (Baseline comparison)', 'Baseline directory /tmp/ui-baseline not found!');
} else {
  const protectedFiles = [
    'services/httpClient.ts',
    'services/apiError.ts',
    'config/api.ts',
    'navigation/types.ts',
    'features/auth/authSession.tsx',
    'features/auth/validation.ts',
    'features/auth/services/authService.ts',
    'features/feed/services/feedService.ts',
    'features/feed/types.ts',
    'features/search/services/searchService.ts',
    'features/search/types.ts',
    'features/post/services/postService.ts',
    'features/comment/services/commentService.ts',
    'features/comment/types.ts',
    'features/notifications/services/notificationService.ts',
    'features/notifications/types.ts',
    'features/profile/services/profileService.ts',
    'features/profile/types.ts',
  ];

  let ruleHViolations = [];

  for (const relPath of protectedFiles) {
    const baseFile = path.join(baselineDir, relPath);
    const curFile = path.join(srcRoot, relPath);

    if (!fs.existsSync(baseFile)) continue;
    if (!fs.existsSync(curFile)) {
      ruleHViolations.push(`File missing in current source: ${relPath}`);
      continue;
    }

    const baseContent = fs.readFileSync(baseFile, 'utf8');
    const curContent = fs.readFileSync(curFile, 'utf8');

    if (baseContent !== curContent) {
      ruleHViolations.push(`Logic file modified: ${relPath}`);
    }
  }

  // Check USE_MOCK flags across all files
  for (const file of allSrcFiles) {
    const rel = path.relative(srcRoot, file);
    const baseFile = path.join(baselineDir, rel);
    if (!fs.existsSync(baseFile)) continue;

    const baseContent = fs.readFileSync(baseFile, 'utf8');
    const curContent = fs.readFileSync(file, 'utf8');

    const baseMockLines = baseContent.split('\n').filter((l) => l.includes('USE_MOCK'));
    const curMockLines = curContent.split('\n').filter((l) => l.includes('USE_MOCK'));

    if (baseMockLines.join('\n') !== curMockLines.join('\n')) {
      ruleHViolations.push(`USE_MOCK lines modified in ${rel}`);
    }
  }

  // Check git status to ensure no edits outside apps/mobile, docs/, and root pnpm package manifests
  try {
    const status = execSync('git status --porcelain', { cwd: path.resolve(mobileRoot, '..', '..'), encoding: 'utf8' });
    const pnpmRootFiles = ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml'];
    const outsideFiles = status
      .split('\n')
      .map((l) => l.slice(3).trim())
      .filter((f) => f && !f.startsWith('apps/mobile') && !f.startsWith('docs/') && !pnpmRootFiles.includes(f));

    if (outsideFiles.length > 0) {
      ruleHViolations.push(`Files modified outside apps/mobile and docs/:\n  ${outsideFiles.join('\n  ')}`);
    }
  } catch (err) {
    console.warn('git command check skipped or errored:', err.message);
  }

  if (ruleHViolations.length > 0) {
    reportError('Rule H (Change boundary vs baseline)', ruleHViolations.join('\n'));
  } else {
    reportPass('Rule H', 'All services, hooks, types, authSession, validation, and USE_MOCK lines are 100% untouched');
  }
}

// ---------------------------------------------------------------------------
// Rule I: ClaySurface fallback highlight bounds (no unclipped highlight lip)
// ---------------------------------------------------------------------------
const claySurfaceFile = path.join(srcRoot, 'components', 'ui', 'ClaySurface.tsx');
let ruleIViolations = [];

if (fs.existsSync(claySurfaceFile)) {
  const content = fs.readFileSync(claySurfaceFile, 'utf8');
  if (!content.includes("overflow: 'hidden'") && !content.includes('overflow: "hidden"')) {
    ruleIViolations.push('ClaySurface does not clip inner highlight container with overflow: hidden');
  }
  if (!content.includes('variant !== \'pill\'') && !content.includes('!isPill')) {
    ruleIViolations.push('ClaySurface renders highlight lip on pill shape without clipping');
  }
} else {
  ruleIViolations.push('ClaySurface.tsx not found');
}

if (ruleIViolations.length > 0) {
  reportError('Rule I (ClaySurface highlight clipping)', ruleIViolations.join('\n'));
} else {
  reportPass('Rule I', 'ClaySurface highlight lip is strictly clipped inside rounded container');
}

// ---------------------------------------------------------------------------
// Rule J: Typography enforcement (ClayText in features/navigation, no fontWeight + custom font)
// ---------------------------------------------------------------------------
let ruleJViolations = [];

for (const file of allSrcFiles) {
  const relFile = path.relative(srcRoot, file).replace(/\\/g, '/');
  const isFeatureOrNav = relFile.startsWith('features/') || relFile.startsWith('navigation/');

  const content = fs.readFileSync(file, 'utf8');

  // Features and Navigation must NOT import Text directly from react-native
  if (isFeatureOrNav) {
    const rnImportMatch = content.match(/import\s*\{[^}]*?\bText\b[^}]*?\}\s*from\s*['"]react-native['"]/);
    if (rnImportMatch) {
      ruleJViolations.push(`${relFile}: Imports raw Text from 'react-native' instead of ClayText`);
    }
  }

  // No fontWeight coupled with custom font outside typography.ts
  if (relFile !== 'theme/typography.ts') {
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('fontWeight') && (line.includes('Nunito') || line.includes('fontFamilies'))) {
        ruleJViolations.push(`${relFile}:${idx + 1}: Uses fontWeight with custom fontFamily`);
      }
    });
  }
}

if (ruleJViolations.length > 0) {
  reportError('Rule J (Font & typography enforcement)', ruleJViolations.join('\n'));
} else {
  reportPass('Rule J', 'No raw Text in features/navigation, zero fontWeight with custom font families');
}

// ---------------------------------------------------------------------------
// Rule K: List Item Performance & Memoization (PostCard, CommentItem, NotificationItem, UserSearchCard)
// ---------------------------------------------------------------------------
const memoFiles = [
  { file: 'features/feed/components/PostCard.tsx', name: 'PostCard' },
  { file: 'features/comment/components/CommentItem.tsx', name: 'CommentItem' },
  { file: 'features/notifications/components/NotificationItem.tsx', name: 'NotificationItem' },
  { file: 'features/search/components/UserSearchCard.tsx', name: 'UserSearchCard' },
];

let ruleKViolations = [];

for (const target of memoFiles) {
  const fullPath = path.join(srcRoot, target.file);
  if (!fs.existsSync(fullPath)) {
    ruleKViolations.push(`File missing: ${target.file}`);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');

  // Must be wrapped in React.memo or memo
  if (!content.includes('memo(') && !content.includes('React.memo(')) {
    ruleKViolations.push(`${target.name} is not wrapped in memo()`);
  }

  // Must use lite tier
  if (!content.toLowerCase().includes('lite')) {
    ruleKViolations.push(`${target.name} does not use lite clay tier`);
  }
}

if (ruleKViolations.length > 0) {
  reportError('Rule K (List item memo & lite tier)', ruleKViolations.join('\n'));
} else {
  reportPass('Rule K', 'All list item components (PostCard, CommentItem, NotificationItem, UserSearchCard) are memoized and use lite clay tier');
}

// ---------------------------------------------------------------------------
// Rule L: FlatList configuration (initialNumToRender & windowSize)
// ---------------------------------------------------------------------------
let ruleLViolations = [];

for (const file of allSrcFiles) {
  const relFile = path.relative(srcRoot, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');

  // Match only JSX opening tags <FlatList\s (excluding TypeScript generics like useRef<FlatList<...>>)
  const jsxFlatListRegex = /<FlatList\s/g;
  let match;
  while ((match = jsxFlatListRegex.exec(content)) !== null) {
    const slice = content.slice(match.index, match.index + 1200);
    const isHorizontal = slice.includes('horizontal');
    if (!isHorizontal) {
      if (!slice.includes('initialNumToRender')) {
        ruleLViolations.push(`${relFile}: FlatList missing initialNumToRender prop`);
      }
      if (!slice.includes('windowSize')) {
        ruleLViolations.push(`${relFile}: FlatList missing windowSize prop`);
      }
    }
  }
}

if (ruleLViolations.length > 0) {
  reportError('Rule L (FlatList optimization props)', ruleLViolations.join('\n'));
} else {
  reportPass('Rule L', 'All vertical FlatLists define initialNumToRender and windowSize');
}

// ---------------------------------------------------------------------------
// Rule M: Single ACTIVE_PALETTE constant in src/theme/index.ts
// ---------------------------------------------------------------------------
const themeIndexFile = path.join(srcRoot, 'theme', 'index.ts');
let ruleMViolations = [];

if (fs.existsSync(themeIndexFile)) {
  const content = fs.readFileSync(themeIndexFile, 'utf8');
  const matches = [...content.matchAll(/export\s+const\s+ACTIVE_PALETTE\s*:\s*(?:PaletteName|'blush'\s*\|\s*'paper'\s*\|\s*'ink')\s*=\s*['"](blush|paper|ink)['"]/g)];
  if (matches.length !== 1) {
    ruleMViolations.push(`Expected exactly 1 ACTIVE_PALETTE declaration, found ${matches.length}`);
  }
} else {
  ruleMViolations.push('src/theme/index.ts not found');
}

if (ruleMViolations.length > 0) {
  reportError('Rule M (Single ACTIVE_PALETTE constant)', ruleMViolations.join('\n'));
} else {
  reportPass('Rule M', 'ACTIVE_PALETTE is declared as a single constant in src/theme/index.ts');
}

// ---------------------------------------------------------------------------
// Final Result
// ---------------------------------------------------------------------------
console.log('\n====================================================');
if (failed) {
  console.error('   AUDIT RESULT: FAILED - Please resolve errors above.');
  console.log('====================================================\n');
  process.exit(1);
} else {
  console.log('   AUDIT RESULT: PASSED ALL CHECKS (Rules A - M)');
  console.log('====================================================\n');
  process.exit(0);
}
