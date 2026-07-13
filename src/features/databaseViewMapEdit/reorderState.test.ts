import { describe, expect, it } from 'vitest';
import { generateViewId } from '@shared/lib/databaseDocument';
import { normalizeRequestedOrder, sameIds, sameIdSet } from './reorderState';

const FAKE_VIEW_ID_A = generateViewId();
const FAKE_VIEW_ID_B = generateViewId();
const FAKE_VIEW_ID_C = generateViewId();
const FAKE_VIEW_ID_D = generateViewId();

describe('reorderState', () => {
  it('sameIds distinguishes equal, different-order, and different-length sequences', () => {
    expect(sameIds([FAKE_VIEW_ID_A, FAKE_VIEW_ID_B], [FAKE_VIEW_ID_A, FAKE_VIEW_ID_B])).toBe(true);
    expect(sameIds([FAKE_VIEW_ID_A, FAKE_VIEW_ID_B], [FAKE_VIEW_ID_B, FAKE_VIEW_ID_A])).toBe(false);
    expect(sameIds([FAKE_VIEW_ID_A, FAKE_VIEW_ID_B], [FAKE_VIEW_ID_A])).toBe(false);
  });

  it('sameIdSet ignores order but still rejects membership changes and length mismatches', () => {
    expect(sameIdSet([FAKE_VIEW_ID_A, FAKE_VIEW_ID_B], [FAKE_VIEW_ID_B, FAKE_VIEW_ID_A])).toBe(
      true,
    );
    expect(sameIdSet([FAKE_VIEW_ID_A, FAKE_VIEW_ID_B], [FAKE_VIEW_ID_A, FAKE_VIEW_ID_C])).toBe(
      false,
    );
    expect(sameIdSet([FAKE_VIEW_ID_A, FAKE_VIEW_ID_B], [FAKE_VIEW_ID_A])).toBe(false);
  });

  it('normalizeRequestedOrder keeps requested existing ids in requested order and appends missing canonical ids', () => {
    expect(
      normalizeRequestedOrder(
        [FAKE_VIEW_ID_C, FAKE_VIEW_ID_A, FAKE_VIEW_ID_D],
        [FAKE_VIEW_ID_A, FAKE_VIEW_ID_B, FAKE_VIEW_ID_C],
      ),
    ).toEqual([FAKE_VIEW_ID_C, FAKE_VIEW_ID_A, FAKE_VIEW_ID_B]);
  });
});
