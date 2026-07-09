import { describe, expect, it } from 'vitest';
import {
  getReorderDescendantInteractiveSelector,
  REORDER_ACTIVATION_SURFACE_ATTRIBUTE,
  REORDER_IGNORE_ATTRIBUTE,
  REORDER_ITEM_ATTRIBUTE,
} from './constants';

describe('getReorderDescendantInteractiveSelector', () => {
  it('matches ignored draggable roots as well as ignored descendants, without an activation-surface exemption', () => {
    const selector = getReorderDescendantInteractiveSelector(`[${REORDER_IGNORE_ATTRIBUTE}]`);

    expect(selector).toBe(
      `[${REORDER_ITEM_ATTRIBUTE}][${REORDER_IGNORE_ATTRIBUTE}], ` +
        `[${REORDER_ITEM_ATTRIBUTE}] [${REORDER_IGNORE_ATTRIBUTE}]`,
    );
  });

  it('preserves both root and descendant matching for each interactive selector, excluding the row-owned activation surface', () => {
    expect(getReorderDescendantInteractiveSelector('button, [role="button"]')).toBe(
      `[${REORDER_ITEM_ATTRIBUTE}]button:not([${REORDER_ACTIVATION_SURFACE_ATTRIBUTE}]), ` +
        `[${REORDER_ITEM_ATTRIBUTE}] button:not([${REORDER_ACTIVATION_SURFACE_ATTRIBUTE}]), ` +
        `[${REORDER_ITEM_ATTRIBUTE}][role="button"]:not([${REORDER_ACTIVATION_SURFACE_ATTRIBUTE}]), ` +
        `[${REORDER_ITEM_ATTRIBUTE}] [role="button"]:not([${REORDER_ACTIVATION_SURFACE_ATTRIBUTE}])`,
    );
  });

  it('does not filter a descendant button that carries the activation-surface marker', () => {
    const selector = getReorderDescendantInteractiveSelector('button');
    const reorderItem = document.createElement('div');

    reorderItem.setAttribute(REORDER_ITEM_ATTRIBUTE, 'a');

    const activationButton = document.createElement('button');
    activationButton.setAttribute(REORDER_ACTIVATION_SURFACE_ATTRIBUTE, '');
    const plainButton = document.createElement('button');

    reorderItem.append(activationButton, plainButton);
    document.body.appendChild(reorderItem);

    expect(activationButton.matches(selector)).toBe(false);
    expect(plainButton.matches(selector)).toBe(true);

    reorderItem.remove();
  });
});
