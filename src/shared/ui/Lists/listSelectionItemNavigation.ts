import type { MDListSelectionItemRecord, MDListSelectionRegistry } from './listContext';

interface MDListSelectionItemSnapshot {
  element: HTMLElement;
  isDisabled: boolean;
  isSelected: boolean;
}

const compareItemOrder = (left: HTMLElement, right: HTMLElement) => {
  if (left === right) {
    return 0;
  }

  return left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
};

const toSelectionItemSnapshot = (
  record: MDListSelectionItemRecord,
): MDListSelectionItemSnapshot | null => {
  const element = record.getElement();

  if (!(element instanceof HTMLElement)) {
    return null;
  }

  return {
    element,
    isDisabled: record.isDisabled(),
    isSelected: record.isSelected(),
  };
};

const getSelectionItemSnapshots = (
  selectionRegistry: MDListSelectionRegistry,
): MDListSelectionItemSnapshot[] =>
  selectionRegistry
    .getItems()
    .map(toSelectionItemSnapshot)
    .filter((record): record is MDListSelectionItemSnapshot => record !== null)
    .sort((left, right) => compareItemOrder(left.element, right.element));

const getEnabledSelectionItemSnapshots = (
  selectionRegistry: MDListSelectionRegistry,
): MDListSelectionItemSnapshot[] =>
  getSelectionItemSnapshots(selectionRegistry).filter((record) => !record.isDisabled);

const resolveSelectionItemElement = (
  selectionRegistry: MDListSelectionRegistry,
  currentTarget: HTMLElement,
): HTMLElement | null =>
  getSelectionItemSnapshots(selectionRegistry).find(
    (record) => record.element === currentTarget || record.element.contains(currentTarget),
  )?.element ?? null;

/**
 * Resolves the selection item that owns a DOM event, scoped to this list's own registry
 * only. A nested `MDList` renders inside the DOM subtree of one of this list's items, so a
 * bubbled event whose nearest `[role="option"]` ancestor is not itself one of this list's
 * registered items originated in a nested selection list and must be ignored here.
 * @param selectionRegistry - Vue-owned registry for this list's selection items.
 * @param eventTarget - The DOM event target to resolve ownership for.
 * @returns The owning item element, or `null` when the event belongs to a nested list.
 */
export const resolveOwnSelectionItemTarget = (
  selectionRegistry: MDListSelectionRegistry,
  eventTarget: HTMLElement,
): HTMLElement | null => {
  const candidate = resolveSelectionItemElement(selectionRegistry, eventTarget);

  if (!candidate) {
    return null;
  }

  const nearestOption = eventTarget.closest('[role="option"]');

  if (nearestOption && nearestOption !== candidate) {
    return null;
  }

  return candidate;
};

const setActiveItem = (records: MDListSelectionItemSnapshot[], active: HTMLElement | null) => {
  for (const record of records) {
    record.element.tabIndex = active !== null && record.element === active ? 0 : -1;
  }
};

/**
 * Synchronizes roving tab stops for listbox selection items, preferring the active
 * enabled item, then the selected enabled item, then the first enabled item.
 * @param selectionRegistry - Vue-owned registry for this list's selection items.
 */
export const syncListSelectionItemTabStops = (selectionRegistry: MDListSelectionRegistry) => {
  const records = getSelectionItemSnapshots(selectionRegistry);
  const enabledRecords = records.filter((record) => !record.isDisabled);
  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const activeItem =
    activeElement === null ? null : resolveSelectionItemElement(selectionRegistry, activeElement);

  const activeEnabledItem =
    activeItem !== null
      ? (enabledRecords.find((record) => record.element === activeItem)?.element ?? null)
      : null;
  const selectedEnabledItem =
    enabledRecords.find((record) => record.isSelected)?.element ??
    enabledRecords[0]?.element ??
    null;

  setActiveItem(records, activeEnabledItem ?? selectedEnabledItem);
};

/**
 * Moves roving focus to the requested enabled selection item.
 * @param selectionRegistry - Vue-owned registry for this list's selection items.
 * @param target - Item that should receive focus.
 */
export const focusListSelectionItem = (
  selectionRegistry: MDListSelectionRegistry,
  target: HTMLElement,
) => {
  const records = getSelectionItemSnapshots(selectionRegistry);
  const isTargetEnabled = records.some((record) => record.element === target && !record.isDisabled);

  if (!isTargetEnabled) {
    syncListSelectionItemTabStops(selectionRegistry);
    return;
  }

  setActiveItem(records, target);
  target.focus();
};

/**
 * Resolves the next enabled selection item for roving keyboard navigation.
 * @param selectionRegistry - Vue-owned registry for this list's selection items.
 * @param currentTarget - Current keyboard event target inside the list.
 * @param direction - Navigation direction or edge target.
 * @returns The next enabled item, or `null` when no enabled items exist.
 */
export const getNextEnabledListSelectionItem = (
  selectionRegistry: MDListSelectionRegistry,
  currentTarget: HTMLElement,
  direction: 'first' | 'last' | 1 | -1,
): HTMLElement | null => {
  const enabledItems = getEnabledSelectionItemSnapshots(selectionRegistry).map(
    (record) => record.element,
  );

  if (!enabledItems.length) {
    return null;
  }

  if (direction === 'first') {
    return enabledItems[0] ?? null;
  }

  if (direction === 'last') {
    return enabledItems.at(-1) ?? null;
  }

  const currentItem = resolveSelectionItemElement(selectionRegistry, currentTarget);
  const currentIndex = currentItem ? enabledItems.findIndex((item) => item === currentItem) : -1;

  if (currentIndex === -1) {
    return direction === 1 ? (enabledItems[0] ?? null) : (enabledItems.at(-1) ?? null);
  }

  return (
    enabledItems.at((currentIndex + direction + enabledItems.length) % enabledItems.length) ?? null
  );
};
