import { describe, expect, it } from 'vitest';

import { isUnsupportedCompatTarget } from './unsupportedRetainedReleases.mjs';

describe('isUnsupportedCompatTarget', () => {
  it('classifies develop release 2 as unsupported', () => {
    expect(isUnsupportedCompatTarget('develop', 2)).toBe(true);
  });

  it('does not classify stable release 2 as unsupported', () => {
    expect(isUnsupportedCompatTarget('stable', 2)).toBe(false);
  });

  it('does not classify develop release 1 or 3 as unsupported', () => {
    expect(isUnsupportedCompatTarget('develop', 1)).toBe(false);
    expect(isUnsupportedCompatTarget('develop', 3)).toBe(false);
  });
});
