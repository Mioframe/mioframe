import { describe, expect, it } from 'vitest';
import { isZipProgressCountDue, ZIP_PROGRESS_COUNT_INTERVAL } from './repositoryZipProgress';

describe('isZipProgressCountDue', () => {
  it('is due for the first count', () => {
    expect(isZipProgressCountDue(0, 10_000)).toBe(true);
  });

  it('is due on every interval boundary', () => {
    expect(isZipProgressCountDue(ZIP_PROGRESS_COUNT_INTERVAL, 10_000)).toBe(true);
    expect(isZipProgressCountDue(ZIP_PROGRESS_COUNT_INTERVAL * 2, 10_000)).toBe(true);
  });

  it('is not due between interval boundaries when the count has not reached the total', () => {
    expect(isZipProgressCountDue(1, 10_000)).toBe(false);
    expect(isZipProgressCountDue(ZIP_PROGRESS_COUNT_INTERVAL - 1, 10_000)).toBe(false);
    expect(isZipProgressCountDue(ZIP_PROGRESS_COUNT_INTERVAL + 1, 10_000)).toBe(false);
  });

  it('is due when the count reaches a known total that is not on an interval boundary', () => {
    expect(isZipProgressCountDue(2, 2)).toBe(true);
    expect(isZipProgressCountDue(30, 30)).toBe(true);
  });

  it('is not due at a non-boundary count when the total is unknown', () => {
    expect(isZipProgressCountDue(1, undefined)).toBe(false);
    expect(isZipProgressCountDue(49, undefined)).toBe(false);
  });

  it('is due at an interval boundary even when the total is unknown', () => {
    expect(isZipProgressCountDue(ZIP_PROGRESS_COUNT_INTERVAL, undefined)).toBe(true);
  });
});
