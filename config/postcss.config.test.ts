import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
// @ts-expect-error Local PostCSS config is plain JS and has no generated declaration file.
import postcssConfig from '../postcss.config.js';

const processCss = async (css: string) =>
  postcss(postcssConfig.plugins).process(css, {
    from: undefined,
  });

describe('postcss custom Material units', () => {
  it('transforms step, sp, and dp through the shared base variables', async () => {
    const result = await processCss(`
      .demo {
        margin: 2step;
        font-size: 14sp;
        border-radius: 3dp;
      }
    `);

    expect(result.css).toContain('margin: calc(var(--one-step) * 2);');
    expect(result.css).toContain('font-size: calc(var(--one-sp) * 14);');
    expect(result.css).toContain('border-radius: calc(var(--one-dp) * 3);');
  });

  it('keeps Material typescale authoring free of legacy pt units', () => {
    const materialBaseUnits = readFileSync('./src/shared/lib/md/index.css', 'utf8');
    const materialTokens = readFileSync('./src/shared/lib/md/tokens.css', 'utf8');

    expect(materialBaseUnits).toContain('--one-sp: 1px;');
    expect(materialTokens).toContain('--app-debug-unknown-color');
    expect(materialTokens).not.toContain('--unknownColor');
    expect(materialTokens).not.toMatch(/\b\d*\.?\d+pt\b/);
  });
});
