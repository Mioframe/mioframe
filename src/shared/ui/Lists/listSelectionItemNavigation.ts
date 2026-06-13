const LIST_SELECTION_ITEM_SELECTOR = '[data-md-list-selection-item="true"]';

interface MDListSelectionItemRecord {
  element: HTMLElement;
  isDisabled: boolean;
  isSelected: boolean;
}

const toSelectionItemRecord = (element: HTMLElement): MDListSelectionItemRecord => ({
  element,
  isDisabled: element.getAttribute('aria-disabled') === 'true',
  isSelected: element.getAttribute('aria-selected') === 'true',
});

const getSelectionItemRecords = (container: HTMLElement): MDListSelectionItemRecord[] =>
  Array.from(
    container.querySelectorAll<HTMLElement>(LIST_SELECTION_ITEM_SELECTOR),
    toSelectionItemRecord,
  );

const getEnabledSelectionItemRecords = (container: HTMLElement): MDListSelectionItemRecord[] =>
  getSelectionItemRecords(container).filter((record) => !record.isDisabled);

const setActiveItem = (records: MDListSelectionItemRecord[], active: HTMLElement | null) => {
  for (const record of records) {
    record.element.tabIndex = active !== null && record.element === active ? 0 : -1;
  }
};

/**
 * Synchronizes roving tab stops for listbox selection items, preferring the active
 * enabled item, then the selected enabled item, then the first enabled item.
 * @param container - List container that owns the selection item set.
 */
export const syncListSelectionItemTabStops = (container: HTMLElement) => {
  const records = getSelectionItemRecords(container);
  const enabledRecords = records.filter((record) => !record.isDisabled);
  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const activeEnabledItem =
    activeElement !== null
      ? (enabledRecords.find((record) => record.element === activeElement)?.element ?? null)
      : null;
  const selectedEnabledItem =
    enabledRecords.find((record) => record.isSelected)?.element ??
    enabledRecords[0]?.element ??
    null;

  setActiveItem(records, activeEnabledItem ?? selectedEnabledItem);
};

/**
 * Moves roving focus to the requested enabled selection item.
 * @param container - List container that owns the selection item set.
 * @param target - Item that should receive focus.
 */
export const focusListSelectionItem = (container: HTMLElement, target: HTMLElement) => {
  const records = getSelectionItemRecords(container);
  const isTargetEnabled = records.some((record) => record.element === target && !record.isDisabled);

  if (!isTargetEnabled) {
    syncListSelectionItemTabStops(container);
    return;
  }

  setActiveItem(records, target);
  target.focus();
};

/**
 * Resolves the next enabled selection item for roving keyboard navigation.
 * @param container - List container that owns the selection item set.
 * @param currentTarget - Current keyboard event target inside the list.
 * @param direction - Navigation direction or edge target.
 * @returns The next enabled item, or `null` when no enabled items exist.
 */
export const getNextEnabledListSelectionItem = (
  container: HTMLElement,
  currentTarget: HTMLElement,
  direction: 'first' | 'last' | 1 | -1,
): HTMLElement | null => {
  const enabledItems = getEnabledSelectionItemRecords(container).map((record) => record.element);

  if (!enabledItems.length) {
    return null;
  }

  if (direction === 'first') {
    return enabledItems[0] ?? null;
  }

  if (direction === 'last') {
    return enabledItems.at(-1) ?? null;
  }

  const currentItem = currentTarget.closest<HTMLElement>(LIST_SELECTION_ITEM_SELECTOR);
  const currentIndex = currentItem ? enabledItems.findIndex((item) => item === currentItem) : -1;

  if (currentIndex === -1) {
    return direction === 1 ? (enabledItems[0] ?? null) : (enabledItems.at(-1) ?? null);
  }

  return (
    enabledItems.at((currentIndex + direction + enabledItems.length) % enabledItems.length) ?? null
  );
};
