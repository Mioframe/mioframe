import { existsSync, readFileSync } from 'node:fs';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

const LEGACY_TOKENS_PATH = './src/shared/lib/md/tokens.css';
const FOUNDATION_TOKENS_PATH = './src/shared/ui/material/foundation/tokens.css';
const FOUNDATION_THEME_PATH = './src/shared/ui/material/foundation/theme.css';
const FOUNDATION_INDEX_PATH = './src/shared/ui/material/foundation/index.css';
const LOADING_INDICATOR_TOKENS_PATH =
  './src/shared/ui/material/components/loading-indicator/tokens.css';
const APP_STYLES_PATH = './src/app/styles/styles.css';
const MD_INDEX_PATH = './src/shared/lib/md/index.css';
const TOKEN_API_DOC_PATH = './src/shared/ui/material/docs/token-api.md';

/**
 * Sanctioned exception: the dark-mode elevation override intentionally lives in
 * theme.css on top of the renderer-independent default declared in tokens.css.
 */
const SANCTIONED_CROSS_FILE_TOKENS = new Set([
  '--md-sys-elevation-level1',
  '--md-sys-elevation-level2',
]);

const extractDeclaredCustomProperties = (css: string): Set<string> => {
  const names = new Set<string>();
  for (const match of css.matchAll(/^\s*(--[\w-]+)\s*:/gm)) {
    const name = match[1];
    if (name) names.add(name);
  }
  return names;
};

const extractCatalogueTableTokens = (doc: string): Set<string> => {
  const names = new Set<string>();
  for (const line of doc.split('\n')) {
    const trimmed = line.trim();
    if (!/^\|\s*`--/.test(trimmed)) continue;
    // Only the first table cell (the "Token" column) lists catalogue entries;
    // other cells may mention private/application tokens in prose.
    const tokenCell = trimmed.split('|')[1] ?? '';
    for (const match of tokenCell.matchAll(/`(--[\w-]+)`/g)) {
      const name = match[1];
      if (name) names.add(name);
    }
  }
  return names;
};

const SELECTED_SYSTEM_COLOR_MAPPINGS = {
  '--md-sys-color-inverse-surface': '--md-ref-palette-neutral20',
  '--md-sys-color-inverse-on-surface': '--md-ref-palette-neutral95',
  '--md-sys-color-inverse-primary': '--md-ref-palette-primary80',
  '--md-sys-color-outline': '--md-ref-palette-neutral-variant50',
  '--md-sys-color-outline-variant': '--md-ref-palette-neutral-variant80',
} as const;

const extractSelectedMappings = (css: string, dark: boolean): Record<string, string> => {
  const root = postcss.parse(css, { from: FOUNDATION_THEME_PATH });
  const darkMedia = root.nodes.find(
    (node): node is postcss.AtRule =>
      node.type === 'atrule' &&
      node.name === 'media' &&
      node.params === '(prefers-color-scheme: dark)',
  );
  const nodes = dark ? darkMedia?.nodes : root.nodes;
  const rootRule = nodes?.find(
    (node): node is postcss.Rule => node.type === 'rule' && node.selector === ':root',
  );
  const mappings: Record<string, string> = {};

  rootRule?.each((node) => {
    if (node.type !== 'decl' || !(node.prop in SELECTED_SYSTEM_COLOR_MAPPINGS)) return;
    const match = node.value.match(/^var\((--md-ref-palette-[\w-]+)\)$/);
    if (match?.[1]) mappings[node.prop] = match[1];
  });

  return mappings;
};

describe('Material foundation token ownership', () => {
  const foundationTokens = readFileSync(FOUNDATION_TOKENS_PATH, 'utf8');
  const foundationTheme = readFileSync(FOUNDATION_THEME_PATH, 'utf8');
  const foundationIndex = readFileSync(FOUNDATION_INDEX_PATH, 'utf8');
  const loadingIndicatorTokens = readFileSync(LOADING_INDICATOR_TOKENS_PATH, 'utf8');
  const appStyles = readFileSync(APP_STYLES_PATH, 'utf8');
  const mdIndex = readFileSync(MD_INDEX_PATH, 'utf8');
  const catalogue = readFileSync(TOKEN_API_DOC_PATH, 'utf8');

  it('removes the legacy mixed-owner token file', () => {
    expect(existsSync(LEGACY_TOKENS_PATH)).toBe(false);
  });

  it('imports foundation tokens before theme', () => {
    const tokensIndex = foundationIndex.indexOf("@import './tokens.css';");
    const themeIndex = foundationIndex.indexOf("@import './theme.css';");

    expect(tokensIndex).toBeGreaterThanOrEqual(0);
    expect(themeIndex).toBeGreaterThan(tokensIndex);
  });

  it('loads the canonical foundation entry before legacy shared MD styles', () => {
    const foundationImportIndex = appStyles.indexOf(
      "@import '../../shared/ui/material/foundation/index.css';",
    );
    const legacyMdImportIndex = appStyles.indexOf("@import '../../shared/lib/md/index.css';");

    expect(foundationImportIndex).toBeGreaterThanOrEqual(0);
    expect(legacyMdImportIndex).toBeGreaterThan(foundationImportIndex);
  });

  it('no longer imports the legacy token file from shared MD styles', () => {
    expect(mdIndex).not.toContain('tokens.css');
  });

  it('contains no application or private-renderer tokens in foundation', () => {
    expect(foundationTokens).not.toMatch(/--app-/);
    expect(foundationTheme).not.toMatch(/--app-/);
    expect(foundationTokens).not.toMatch(/--m3e-/);
    expect(foundationTheme).not.toMatch(/--m3e-/);
  });

  it('preserves the four state-opacity values exactly', () => {
    expect(foundationTokens).toContain('--md-sys-state-hover-state-layer-opacity: 8%;');
    expect(foundationTokens).toContain('--md-sys-state-focus-state-layer-opacity: 10%;');
    expect(foundationTokens).toContain('--md-sys-state-pressed-state-layer-opacity: 10%;');
    expect(foundationTokens).toContain('--md-sys-state-dragged-state-layer-opacity: 16%;');
  });

  it('maps the selected inverse and outline roles to their exact light and dark references', () => {
    expect(extractSelectedMappings(foundationTheme, false)).toEqual(SELECTED_SYSTEM_COLOR_MAPPINGS);
    expect(extractSelectedMappings(foundationTheme, true)).toEqual({
      '--md-sys-color-inverse-surface': '--md-ref-palette-neutral90',
      '--md-sys-color-inverse-on-surface': '--md-ref-palette-neutral20',
      '--md-sys-color-inverse-primary': '--md-ref-palette-primary40',
      '--md-sys-color-outline': '--md-ref-palette-neutral-variant60',
      '--md-sys-color-outline-variant': '--md-ref-palette-neutral-variant30',
    });
  });

  describe('public catalogue agreement', () => {
    const declaredTokens = new Set([
      ...extractDeclaredCustomProperties(foundationTokens),
      ...extractDeclaredCustomProperties(foundationTheme),
      ...extractDeclaredCustomProperties(loadingIndicatorTokens),
    ]);
    const publicDeclaredTokens = [...declaredTokens].filter(
      (name) => !name.startsWith('--md-private-') && !name.startsWith('--m3e-'),
    );
    const catalogueTokens = extractCatalogueTableTokens(catalogue);

    it('lists every retained public foundation/theme token', () => {
      const missingFromCatalogue = publicDeclaredTokens.filter(
        (name) => !catalogueTokens.has(name),
      );

      expect(missingFromCatalogue).toEqual([]);
    });

    it('has a runtime declaration for every catalogued token', () => {
      const orphanCatalogueEntries = [...catalogueTokens].filter(
        (name) => !declaredTokens.has(name),
      );

      expect(orphanCatalogueEntries).toEqual([]);
    });

    it('excludes private and application tokens from the catalogue', () => {
      const disallowed = [...catalogueTokens].filter(
        (name) =>
          name.startsWith('--md-private-') ||
          name.startsWith('--app-') ||
          name.startsWith('--m3e-'),
      );

      expect(disallowed).toEqual([]);
    });
  });

  it('has one declaration owner per public token, except the sanctioned elevation override', () => {
    const tokensCssNames = extractDeclaredCustomProperties(foundationTokens);
    const themeCssNames = extractDeclaredCustomProperties(foundationTheme);
    const loadingIndicatorCssNames = extractDeclaredCustomProperties(loadingIndicatorTokens);
    const declarationCounts = new Map<string, number>();

    for (const names of [tokensCssNames, themeCssNames, loadingIndicatorCssNames]) {
      for (const name of names) {
        if (name.startsWith('--md-private-') || name.startsWith('--m3e-')) continue;
        declarationCounts.set(name, (declarationCounts.get(name) ?? 0) + 1);
      }
    }

    const sharedNames = [...declarationCounts]
      .filter(([, count]) => count > 1)
      .map(([name]) => name);

    expect(new Set(sharedNames)).toEqual(SANCTIONED_CROSS_FILE_TOKENS);
  });
});
