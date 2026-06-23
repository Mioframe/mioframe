import type { MDListActionItemRecord, MDListActionRegistry } from './listContext';

/** Which action column a focus target belongs to within one multi-action row. */
export type MDListActionColumn = 'primary' | 'trailing';

interface MDListActionRowSnapshot {
  primaryElement: HTMLElement;
  trailingElement: HTMLElement | null;
  isPrimaryDisabled: boolean;
}

const compareItemOrder = (left: HTMLElement, right: HTMLElement) => {
  if (left === right) {
    return 0;
  }

  return left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
};

const toRowSnapshot = (record: MDListActionItemRecord): MDListActionRowSnapshot | null => {
  const primaryElement = record.getPrimaryElement();

  if (!(primaryElement instanceof HTMLElement)) {
    return null;
  }

  return {
    primaryElement,
    trailingElement: record.getTrailingElement(),
    isPrimaryDisabled: record.isPrimaryDisabled(),
  };
};

const getRowSnapshots = (registry: MDListActionRegistry): MDListActionRowSnapshot[] =>
  registry
    .getItems()
    .map(toRowSnapshot)
    .filter((row): row is MDListActionRowSnapshot => row !== null)
    .sort((left, right) => compareItemOrder(left.primaryElement, right.primaryElement));

/**
 * Resolves the row and column a DOM event target belongs to, scoped to this list's own
 * registry only. A nested `MDList` renders inside one row's primary/trailing DOM subtree,
 * so an event whose nearest registered row element does not equal the bubbled target's own
 * closest action element originated in a nested list and must be ignored here.
 * @param registry - Vue-owned registry for this list's action rows.
 * @param eventTarget - The DOM event target to resolve ownership for.
 * @returns The owning row and column, or `null` when the event belongs to a nested list.
 */
export const resolveOwnActionItemTarget = (
  registry: MDListActionRegistry,
  eventTarget: HTMLElement,
): { row: MDListActionRowSnapshot; column: MDListActionColumn } | null => {
  const rows = getRowSnapshots(registry);

  for (const row of rows) {
    if (row.primaryElement === eventTarget || row.primaryElement.contains(eventTarget)) {
      return { row, column: 'primary' };
    }

    if (
      row.trailingElement &&
      (row.trailingElement === eventTarget || row.trailingElement.contains(eventTarget))
    ) {
      return { row, column: 'trailing' };
    }
  }

  return null;
};

const getColumnElement = (
  row: MDListActionRowSnapshot,
  column: MDListActionColumn,
): HTMLElement | null => (column === 'primary' ? row.primaryElement : row.trailingElement);

/**
 * Resolves the next enabled row in the same action column for vertical roving navigation.
 * Falls back to the primary action when the target row has no element in the requested
 * column (e.g. moving past a row with no trailing action).
 * @param registry - Vue-owned registry for this list's action rows.
 * @param currentTarget - Current keyboard event target inside the list.
 * @param column - Active action column to keep when moving vertically.
 * @param direction - Navigation direction or edge target.
 * @returns The next focusable element, or `null` when no enabled row exists.
 */
export const getNextEnabledActionTarget = (
  registry: MDListActionRegistry,
  currentTarget: HTMLElement,
  column: MDListActionColumn,
  direction: 'first' | 'last' | 1 | -1,
): HTMLElement | null => {
  const enabledRows = getRowSnapshots(registry).filter((row) => !row.isPrimaryDisabled);

  if (!enabledRows.length) {
    return null;
  }

  const resolveTarget = (row: MDListActionRowSnapshot | undefined): HTMLElement | null =>
    row ? (getColumnElement(row, column) ?? row.primaryElement) : null;

  if (direction === 'first') {
    return resolveTarget(enabledRows[0]);
  }

  if (direction === 'last') {
    return resolveTarget(enabledRows.at(-1));
  }

  const currentIndex = enabledRows.findIndex(
    (row) => row.primaryElement === currentTarget || row.trailingElement === currentTarget,
  );

  if (currentIndex === -1) {
    return direction === 1 ? resolveTarget(enabledRows[0]) : resolveTarget(enabledRows.at(-1));
  }

  const nextRow = enabledRows.at(
    (currentIndex + direction + enabledRows.length) % enabledRows.length,
  );

  return nextRow ? resolveTarget(nextRow) : null;
};

/**
 * Resolves the counterpart action within the same row for horizontal primary/trailing
 * traversal. Returns `null` when the row has no element in the requested column (e.g. a
 * row with no trailing action has no horizontal counterpart).
 * @param registry - Vue-owned registry for this list's action rows.
 * @param currentTarget - Current keyboard event target inside the list.
 * @returns The counterpart element, or `null` when there is none.
 */
export const getActionRowCounterpart = (
  registry: MDListActionRegistry,
  currentTarget: HTMLElement,
): HTMLElement | null => {
  const target = resolveOwnActionItemTarget(registry, currentTarget);

  if (!target) {
    return null;
  }

  const counterpartColumn: MDListActionColumn =
    target.column === 'primary' ? 'trailing' : 'primary';

  return getColumnElement(target.row, counterpartColumn);
};
