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
    (node): node is postcss.Rule =>
      node.type === 'rule' && node.selector === ":root:not([data-md-color-scheme='light'])",
  );
  const forcedLightRule = root.nodes.find(
    (node): node is postcss.Rule =>
      node.type === 'rule' && node.selector === ":root[data-md-color-scheme='light']",
  );
  const forcedDarkRule = root.nodes.find(
    (node): node is postcss.Rule =>
      node.type === 'rule' && node.selector === ":root[data-md-color-scheme='dark']",
  );

  it('keeps the default :root unguarded, so System with a light OS preference uses the default light mappings', () => {
    expect(defaultRootRule).toBeDefined();
    expect(Object.keys(getSysColorDeclarations(defaultRootRule)).length).toBeGreaterThan(0);
  });

  it('applies the system-dark media query so System with a dark OS preference uses the canonical dark mappings', () => {
    expect(darkMediaRule?.params).toBe('(prefers-color-scheme: dark)');
    expect(Object.keys(getSysColorDeclarations(systemDarkRootRule)).length).toBeGreaterThan(0);
  });

  it('scopes the system-dark media rule to exclude forced Light, so forced Light cannot inherit any dark-only override', () => {
    expect(systemDarkRootRule?.selector).toBe(":root:not([data-md-color-scheme='light'])");
  });

  it('does not duplicate a forced-light token matrix, since excluding forced Light from the dark media rule already restores default light mappings', () => {
    expect(forcedLightRule).toBeUndefined();
  });

  it('declares at least one token in the forced-dark block, so the equality check below cannot pass vacuously', () => {
    expect(Object.keys(getSysColorDeclarations(forcedDarkRule)).length).toBeGreaterThan(0);
  });

  it('resolves forced Dark to the exact same token mappings as system Dark', () => {
    expect(getSysColorDeclarations(forcedDarkRule)).toEqual(
      getSysColorDeclarations(systemDarkRootRule),
    );
  });

  it('keeps the canonical dark elevation override values unchanged', () => {
    const elevation1 =
      '0px 1px 2px 0px rgb(from var(--md-private-elevation-shadow-color) r g b / 0.3), 0px 1px 3px 1px rgb(from var(--md-private-elevation-shadow-color) r g b / 0.15)';
    const elevation2 =
      '0px 1px 2px 0px rgb(from var(--md-private-elevation-shadow-color) r g b / 0.3), 0px 2px 6px 2px rgb(from var(--md-private-elevation-shadow-color) r g b / 0.15)';

    const getElevation = (rule: postcss.Rule | undefined): Record<string, string> => {
      const declarations: Record<string, string> = {};
      rule?.each((node) => {
        if (node.type === 'decl' && node.prop.startsWith('--md-sys-elevation-'))
          declarations[node.prop] = node.value.replace(/\s+/g, ' ').trim();
      });
      return declarations;
    };

    expect(getElevation(systemDarkRootRule)).toEqual({
      '--md-sys-elevation-level1': elevation1,
      '--md-sys-elevation-level2': elevation2,
    });
    expect(getElevation(forcedDarkRule)).toEqual({
      '--md-sys-elevation-level1': elevation1,
      '--md-sys-elevation-level2': elevation2,
    });
  });
});
