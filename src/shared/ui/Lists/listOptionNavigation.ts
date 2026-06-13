const LIST_OPTION_SELECTOR = '[data-md-list-option="true"]';

interface MDListOptionRecord {
  element: HTMLElement;
  isDisabled: boolean;
  isSelected: boolean;
}

const toOptionRecord = (element: HTMLElement): MDListOptionRecord => ({
  element,
  isDisabled: element.getAttribute('aria-disabled') === 'true',
  isSelected: element.getAttribute('aria-selected') === 'true',
});

const getOptionRecords = (container: HTMLElement): MDListOptionRecord[] =>
  Array.from(container.querySelectorAll<HTMLElement>(LIST_OPTION_SELECTOR), toOptionRecord);

const getEnabledOptionRecords = (container: HTMLElement): MDListOptionRecord[] =>
  getOptionRecords(container).filter((record) => !record.isDisabled);

const setActiveOption = (options: MDListOptionRecord[], active: HTMLElement | null) => {
  for (const option of options) {
    option.element.tabIndex = active !== null && option.element === active ? 0 : -1;
  }
};

/**
 * Synchronizes roving tab stops for listbox options, preferring the active
 * enabled option, then the selected enabled option, then the first enabled option.
 * @param container - List container that owns the option set.
 */
export const syncListOptionTabStops = (container: HTMLElement) => {
  const options = getOptionRecords(container);
  const enabledOptions = options.filter((record) => !record.isDisabled);
  const activeElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const activeEnabledOption =
    activeElement !== null
      ? (enabledOptions.find((record) => record.element === activeElement)?.element ?? null)
      : null;
  const selectedEnabledOption =
    enabledOptions.find((record) => record.isSelected)?.element ??
    enabledOptions[0]?.element ??
    null;

  setActiveOption(options, activeEnabledOption ?? selectedEnabledOption);
};

/**
 * Moves roving focus to the requested enabled option.
 * @param container - List container that owns the option set.
 * @param target - Option that should receive focus.
 */
export const focusListOption = (container: HTMLElement, target: HTMLElement) => {
  const options = getOptionRecords(container);
  const isTargetEnabled = options.some((record) => record.element === target && !record.isDisabled);

  if (!isTargetEnabled) {
    syncListOptionTabStops(container);
    return;
  }

  setActiveOption(options, target);
  target.focus();
};

/**
 * Resolves the next enabled list option for roving keyboard navigation.
 * @param container - List container that owns the option set.
 * @param currentTarget - Current keyboard event target inside the list.
 * @param direction - Navigation direction or edge target.
 * @returns The next enabled option, or `null` when no enabled options exist.
 */
export const getNextEnabledListOption = (
  container: HTMLElement,
  currentTarget: HTMLElement,
  direction: 'first' | 'last' | 1 | -1,
): HTMLElement | null => {
  const enabledOptions = getEnabledOptionRecords(container).map((record) => record.element);

  if (!enabledOptions.length) {
    return null;
  }

  if (direction === 'first') {
    return enabledOptions[0] ?? null;
  }

  if (direction === 'last') {
    return enabledOptions.at(-1) ?? null;
  }

  const currentOption = currentTarget.closest<HTMLElement>(LIST_OPTION_SELECTOR);
  const currentIndex = currentOption
    ? enabledOptions.findIndex((option) => option === currentOption)
    : -1;

  if (currentIndex === -1) {
    return direction === 1 ? (enabledOptions[0] ?? null) : (enabledOptions.at(-1) ?? null);
  }

  return (
    enabledOptions.at((currentIndex + direction + enabledOptions.length) % enabledOptions.length) ??
    null
  );
};
