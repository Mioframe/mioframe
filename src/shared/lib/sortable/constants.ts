/** Attribute used by SortableJS to read a stable item id from the DOM. */
export const REORDER_ITEM_ATTRIBUTE = 'data-sortable-id';
/** Attribute used to mark controls and subtrees that must not start drag. */
export const REORDER_IGNORE_ATTRIBUTE = 'data-sortable-ignore';
/** Class applied to the surface while a reorder session is active. */
export const REORDER_SURFACE_DRAGGING_CLASS = 'reorder-surface_dragging';

/** Default selector for descendants that should stay interactive instead of draggable. */
export const defaultReorderInteractiveSelector = [
  'button',
  'a',
  'input',
  'textarea',
  'select',
  'option',
  '[contenteditable]',
  '[role="button"]',
  `[${REORDER_IGNORE_ATTRIBUTE}]`,
].join(', ');

/** Scopes an interactive selector to reorder items and their descendants. */
export const getReorderDescendantInteractiveSelector = (interactiveSelector: string): string =>
  interactiveSelector
    .split(',')
    .map((selector) => selector.trim())
    .filter(Boolean)
    .map(
      (selector) =>
        `[${REORDER_ITEM_ATTRIBUTE}]${selector}, [${REORDER_ITEM_ATTRIBUTE}] ${selector}`,
    )
    .join(', ');

/** Class names forwarded to SortableJS for drag state styling. */
export const reorderClassNames = {
  chosen: 'reorder-item_chosen',
  drag: 'reorder-item_drag',
  ghost: 'reorder-item_ghost',
  fallback: 'reorder-item_fallback',
} as const;
