import { REORDER_ITEM_ATTRIBUTE, REORDER_OVERLAY_CLASS } from './constants';

/** Lifted presentation layer that renders the active item during a reorder session. */
export interface ReorderOverlay {
  /**
   * Moves the overlay by a viewport-relative translation from its initial position.
   * @param x - Horizontal translation in CSS pixels.
   * @param y - Vertical translation in CSS pixels.
   */
  move: (x: number, y: number) => void;
  /** Removes the overlay from the document. */
  destroy: () => void;
}

/**
 * Creates the lifted presentation layer for an active reorder item.
 *
 * The overlay is a fixed-position clone of the item mounted on `document.body`, so it
 * escapes every clipping/overflow container and its elevation shadow renders fully. It
 * is engine-positioned only — `pointer-events: none` and `aria-hidden` keep it out of
 * hit testing and the accessibility tree — and the clone's reorder item attribute is
 * stripped so geometry measurement and tests never see it as a second collection item.
 * @param sourceEl - The in-list item element being lifted.
 * @returns Overlay handle, or `undefined` when the document is unavailable.
 */
export const createReorderOverlay = (sourceEl: HTMLElement): ReorderOverlay | undefined => {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const rect = sourceEl.getBoundingClientRect();
  const overlayEl = document.createElement('div');

  overlayEl.className = REORDER_OVERLAY_CLASS;
  overlayEl.setAttribute('aria-hidden', 'true');
  overlayEl.style.left = `${rect.left}px`;
  overlayEl.style.top = `${rect.top}px`;
  overlayEl.style.width = `${rect.width}px`;
  overlayEl.style.height = `${rect.height}px`;

  const clone = sourceEl.cloneNode(true);

  if (clone instanceof HTMLElement) {
    clone.removeAttribute(REORDER_ITEM_ATTRIBUTE);
    clone.removeAttribute('id');
    overlayEl.append(clone);
  }

  document.body.append(overlayEl);

  return {
    move: (x, y) => {
      overlayEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    },
    destroy: () => {
      overlayEl.remove();
    },
  };
};
