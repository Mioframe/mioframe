import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

const FOUNDATION_THEME_PATH = './src/shared/ui/material/foundation/theme.css';

/**
 * Only `--md-sys-*` declarations are theme-mode-dependent. The default `:root` block also
 * declares the theme-independent `--md-ref-palette-*` reference palette, which the forced
 * Light/Dark blocks intentionally do not repeat.
 * @param rule - The parsed postcss rule to read declarations from, or `undefined` when the
 * corresponding block was not found.
 * @returns A map of `--md-sys-*` custom property names to their whitespace-normalized values.
 */
const getSysColorDeclarations = (rule: postcss.Rule | undefined): Record<string, string> => {
  const declarations: Record<string, string> = {};
  rule?.each((node) => {
    if (node.type === 'decl' && node.prop.startsWith('--md-sys-'))
      declarations[node.prop] = node.value.replace(/\s+/g, ' ').trim();
  });
  return declarations;
};

describe('Material foundation theme-mode seam', () => {
  const css = readFileSync(FOUNDATION_THEME_PATH, 'utf8');
  const root = postcss.parse(css, { from: FOUNDATION_THEME_PATH });

  const defaultRootRule = root.nodes.find(
    (node): node is postcss.Rule => node.type === 'rule' && node.selector === ':root',
  );
  const darkMediaRule = root.nodes.find(
    (node): node is postcss.AtRule =>
      node.type === 'atrule' &&
      node.name === 'media' &&
      node.params === '(prefers-color-scheme: dark)',
  );
  const systemDarkRootRule = darkMediaRule?.nodes?.find(
    (node): node is postcss.Rule => node.type === 'rule' && node.selector === ':root',
  );
  const forcedLightRule = root.nodes.find(
    (node): node is postcss.Rule =>
      node.type === 'rule' && node.selector === ":root[data-md-color-scheme='light']",
  );
  const forcedDarkRule = root.nodes.find(
    (node): node is postcss.Rule =>
      node.type === 'rule' && node.selector === ":root[data-md-color-scheme='dark']",
  );

  it('keeps the default :root and the system-dark media query unguarded by the mode attribute, so System stays the default', () => {
    expect(defaultRootRule).toBeDefined();
    expect(darkMediaRule?.params).toBe('(prefers-color-scheme: dark)');
    expect(systemDarkRootRule?.selector).toBe(':root');
  });

  it('declares at least one token in every forced-mode block, so equality checks below cannot pass vacuously', () => {
    expect(Object.keys(getSysColorDeclarations(forcedDarkRule)).length).toBeGreaterThan(0);
    expect(Object.keys(getSysColorDeclarations(forcedLightRule)).length).toBeGreaterThan(0);
  });

  it('resolves forced Dark to the exact same token mappings as system Dark', () => {
    expect(getSysColorDeclarations(forcedDarkRule)).toEqual(
      getSysColorDeclarations(systemDarkRootRule),
    );
  });

  it('resolves forced Light to the exact same token mappings as the default light :root', () => {
    expect(getSysColorDeclarations(forcedLightRule)).toEqual(
      getSysColorDeclarations(defaultRootRule),
    );
  });
});
