import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

const MD_INDEX_PATH = './src/shared/lib/md/index.css';

describe('legacy Material surface ownership', () => {
  const css = readFileSync(MD_INDEX_PATH, 'utf8');
  const root = postcss.parse(css, { from: MD_INDEX_PATH });

  it('does not assign component-owned color or motion through a universal descendant', () => {
    const violations: string[] = [];

    root.walkRules((rule) => {
      const isUniversalDescendant =
        rule.selector.trim() === '*' &&
        rule.parent?.type === 'rule' &&
        rule.parent.selector.split(',').some((selector) => selector.trim() === '.md');
      if (!isUniversalDescendant) return;

      rule.walkDecls((declaration) => {
        if (declaration.prop === 'color' || declaration.prop === 'transition-duration') {
          violations.push(declaration.prop);
        }
      });
    });

    expect(violations).toEqual([]);
  });

  it('contains no private renderer selectors or variables', () => {
    expect(css).not.toMatch(/m3e-/);
  });
});
