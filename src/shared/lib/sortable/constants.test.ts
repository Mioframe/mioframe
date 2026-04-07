import { describe, expect, it } from 'vitest';
import {
  getReorderDescendantInteractiveSelector,
  REORDER_IGNORE_ATTRIBUTE,
  REORDER_ITEM_ATTRIBUTE,
} from './constants';

describe('getReorderDescendantInteractiveSelector', () => {
  it('matches ignored draggable roots as well as ignored descendants', () => {
    const selector = getReorderDescendantInteractiveSelector(
      `[${REORDER_IGNORE_ATTRIBUTE}]`,
    );

    expect(selector).toBe(
      `[${REORDER_ITEM_ATTRIBUTE}][${REORDER_IGNORE_ATTRIBUTE}], ` +
        `[${REORDER_ITEM_ATTRIBUTE}] [${REORDER_IGNORE_ATTRIBUTE}]`,
    );
  });

  it('preserves both root and descendant matching for each interactive selector', () => {
    expect(
      getReorderDescendantInteractiveSelector('button, [role="button"]'),
    ).toBe(
      `[${REORDER_ITEM_ATTRIBUTE}]button, ` +
        `[${REORDER_ITEM_ATTRIBUTE}] button, ` +
        `[${REORDER_ITEM_ATTRIBUTE}][role="button"], ` +
        `[${REORDER_ITEM_ATTRIBUTE}] [role="button"]`,
    );
  });
});
