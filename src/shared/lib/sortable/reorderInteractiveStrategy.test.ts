import { describe, expect, it } from 'vitest';
import { REORDER_IGNORE_ATTRIBUTE } from './constants';
import {
  isReorderFullRowNativeMisconfigured,
  resolveReorderInteractiveSelector,
} from './reorderInteractiveStrategy';

describe('resolveReorderInteractiveSelector', () => {
  it('passes through the custom selector under blockInteractiveDescendants', () => {
    expect(
      resolveReorderInteractiveSelector({
        strategy: 'blockInteractiveDescendants',
        interactiveSelector: 'button, a, [data-custom]',
      }),
    ).toBe('button, a, [data-custom]');
  });

  it('ignores the custom selector and scopes to the ignore attribute under explicitIgnoreOnly', () => {
    expect(
      resolveReorderInteractiveSelector({
        strategy: 'explicitIgnoreOnly',
        interactiveSelector: 'button, a, [data-custom]',
      }),
    ).toBe(`[${REORDER_IGNORE_ATTRIBUTE}]`);
  });
});

describe('isReorderFullRowNativeMisconfigured', () => {
  it('flags fullRowNative activation paired with the default interactive strategy', () => {
    expect(
      isReorderFullRowNativeMisconfigured({
        activation: 'fullRowNative',
        strategy: 'blockInteractiveDescendants',
      }),
    ).toBe(true);
  });

  it('accepts fullRowNative activation paired with explicitIgnoreOnly', () => {
    expect(
      isReorderFullRowNativeMisconfigured({
        activation: 'fullRowNative',
        strategy: 'explicitIgnoreOnly',
      }),
    ).toBe(false);
  });

  it('does not flag non-fullRowNative activations regardless of strategy', () => {
    expect(
      isReorderFullRowNativeMisconfigured({
        activation: 'longPress',
        strategy: 'blockInteractiveDescendants',
      }),
    ).toBe(false);
  });
});
