import { existsSync, readFileSync, readdirSync } from 'node:fs';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

const LEGACY_TOKENS_PATH = './src/shared/lib/md/tokens.css';
const FOUNDATION_TOKENS_PATH = './src/shared/ui/material/foundation/tokens.css';
const FOUNDATION_THEME_PATH = './src/shared/ui/material/foundation/theme.css';
const FOUNDATION_INDEX_PATH = './src/shared/ui/material/foundation/index.css';
const MATERIAL_COMPONENTS_PATH = './src/shared/ui/material/components';
const APP_STYLES_PATH = './src/app/styles/styles.css';
const BASE_STYLES_PATH = './src/app/styles/base.css';
const MD_INDEX_PATH = './src/shared/lib/md/index.css';

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
    (node): node is postcss.Rule =>
      node.type === 'rule' &&
      node.selector === (dark ? ":root:not([data-md-color-scheme='light'])" : ':root'),
  );
  const mappings: Record<string, string> = {};

  rootRule?.each((node) => {
    if (node.type !== 'decl' || !(node.prop in SELECTED_SYSTEM_COLOR_MAPPINGS)) return;
    const match = node.value.match(/^var\((--md-ref-palette-[\w-]+)\)$/);
    if (match?.[1]) mappings[node.prop] = match[1];
  });

  return mappings;
};

const getComponentTokenSources = (): Array<{ path: string; css: string }> =>
  readdirSync(MATERIAL_COMPONENTS_PATH, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `${MATERIAL_COMPONENTS_PATH}/${entry.name}/tokens.css`)
    .filter((path) => existsSync(path))
    .map((path) => ({ path, css: readFileSync(path, 'utf8') }));

describe('Material foundation token ownership', () => {
  const foundationTokens = readFileSync(FOUNDATION_TOKENS_PATH, 'utf8');
  const foundationTheme = readFileSync(FOUNDATION_THEME_PATH, 'utf8');
  const foundationIndex = readFileSync(FOUNDATION_INDEX_PATH, 'utf8');
  const componentTokenSources = getComponentTokenSources();
  const appStyles = readFileSync(APP_STYLES_PATH, 'utf8');
  const baseStyles = readFileSync(BASE_STYLES_PATH, 'utf8');
  const mdIndex = readFileSync(MD_INDEX_PATH, 'utf8');

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
    const foundationImportIndex = baseStyles.indexOf(
      "@import '../../shared/ui/material/foundation/index.css';",
    );
    const legacyMdImportIndex = baseStyles.indexOf("@import '../../shared/lib/md/index.css';");

    expect(foundationImportIndex).toBeGreaterThanOrEqual(0);
    expect(legacyMdImportIndex).toBeGreaterThan(foundationImportIndex);
  });

  it('composes the application shell stylesheet from the shared base stylesheet', () => {
    expect(appStyles).toContain("@import './base.css';");
  });

  it('keeps the application shell stylesheet free of low-level style ownership', () => {
    expect(appStyles).not.toContain("@import '../../shared/ui/material/foundation/index.css';");
    expect(appStyles).not.toContain("@import '../../shared/lib/md/index.css';");
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

  it('keeps application tokens out of Material component token owners', () => {
    for (const { path, css } of componentTokenSources) {
      expect(css, path).not.toMatch(/--app-/);
    }
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

  it('has one declaration owner per public token, except the sanctioned elevation override', () => {
    const declarationCounts = new Map<string, number>();
    const tokenSources = [
      foundationTokens,
      foundationTheme,
      ...componentTokenSources.map(({ css }) => css),
    ];

    for (const css of tokenSources) {
      for (const name of extractDeclaredCustomProperties(css)) {
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
