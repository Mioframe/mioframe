import { describe, expect, it } from 'vitest';
import { shouldTrackLastHoverPointerType } from './useLastHover';

describe('shouldTrackLastHoverPointerType', () => {
  it('ignores touch pointers for hover state', () => {
    expect(shouldTrackLastHoverPointerType('touch')).toBe(false);
  });

  it('keeps mouse and pen hover tracking enabled', () => {
    expect(shouldTrackLastHoverPointerType('mouse')).toBe(true);
    expect(shouldTrackLastHoverPointerType('pen')).toBe(true);
    expect(shouldTrackLastHoverPointerType(undefined)).toBe(true);
  });
});
