/**
 * Minimum processed-entry gap between coalesced intermediate ZIP progress count updates. Keeps
 * a 10,000-entry operation to roughly 200 intermediate RPC round trips instead of one per entry.
 */
export const ZIP_PROGRESS_COUNT_INTERVAL = 50;

/**
 * Whether a processed-entry count should be delivered now: the first count (`current === 0`),
 * every `ZIP_PROGRESS_COUNT_INTERVAL`th count, or a count that reaches the known `total`.
 * Callers still need an explicit final delivery after their loop ends for counts this predicate
 * does not already cover — e.g. an unknown `total`, or a final count not divisible by the
 * interval.
 * @param current - Number of entries processed so far.
 * @param total - Known total entry count, when available.
 * @returns Whether this count is due for delivery.
 */
export const isZipProgressCountDue = (current: number, total: number | undefined): boolean =>
  current % ZIP_PROGRESS_COUNT_INTERVAL === 0 || current === total;
