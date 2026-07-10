import { describe, expect, it } from 'vitest';
import {
  assertUniqueKeys,
  canRollback,
  checkOrderConsistency,
  confirmRequestedMove,
  createOrderExpectation,
  deriveMovedSequence,
  sequencesEqual,
} from './orderConsistency';

describe('sequencesEqual', () => {
  it('is true for identical sequences', () => {
    expect(sequencesEqual(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true);
  });

  it('is false for a different order', () => {
    expect(sequencesEqual(['a', 'b', 'c'], ['a', 'c', 'b'])).toBe(false);
  });

  it('is false for a different length', () => {
    expect(sequencesEqual(['a', 'b'], ['a', 'b', 'c'])).toBe(false);
  });
});

describe('deriveMovedSequence', () => {
  it('derives a moved sequence without mutating the input', () => {
    const original = ['a', 'b', 'c', 'd'];

    const result = deriveMovedSequence(original, 0, 2);

    expect(result).toEqual(['b', 'c', 'a', 'd']);
    expect(original).toEqual(['a', 'b', 'c', 'd']);
  });

  it('handles a backward move', () => {
    expect(deriveMovedSequence(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });
});

describe('assertUniqueKeys', () => {
  it('does not throw for unique keys', () => {
    expect(() => {
      assertUniqueKeys(['a', 'b', 'c']);
    }).not.toThrow();
  });

  it('throws for a duplicate key', () => {
    expect(() => {
      assertUniqueKeys(['a', 'b', 'a']);
    }).toThrow(/duplicate key/);
  });
});

describe('createOrderExpectation', () => {
  it('snapshots the given keys', () => {
    const keys = ['a', 'b'];
    const expectation = createOrderExpectation(keys);

    expect(expectation.sequence).toEqual(['a', 'b']);
    expect(expectation.sequence).not.toBe(keys);
  });

  it('throws for duplicate controlled keys', () => {
    expect(() => createOrderExpectation(['a', 'a'])).toThrow(/duplicate key/);
  });
});

describe('checkOrderConsistency', () => {
  it('is consistent when the live sequence matches the expectation', () => {
    const expectation = createOrderExpectation(['a', 'b', 'c']);

    expect(checkOrderConsistency(expectation, ['a', 'b', 'c'])).toBe('consistent');
  });

  it('detects an external mutation not requested by this session', () => {
    const expectation = createOrderExpectation(['a', 'b', 'c']);

    expect(checkOrderConsistency(expectation, ['c', 'b', 'a'])).toBe('external-mutation');
  });

  it('detects an external removal as a mutation', () => {
    const expectation = createOrderExpectation(['a', 'b', 'c']);

    expect(checkOrderConsistency(expectation, ['a', 'c'])).toBe('external-mutation');
  });
});

describe('confirmRequestedMove', () => {
  it('confirms when the consumer adopted exactly the requested sequence', () => {
    const expectedNext = deriveMovedSequence(['a', 'b', 'c'], 0, 2);

    expect(confirmRequestedMove(expectedNext, ['b', 'c', 'a'])).toBe('confirmed');
  });

  it('rejects when the consumer applied a different sequence', () => {
    const expectedNext = deriveMovedSequence(['a', 'b', 'c'], 0, 2);

    expect(confirmRequestedMove(expectedNext, ['a', 'b', 'c'])).toBe('rejected');
  });

  it('rejects when the active key vanished from the consumer sequence', () => {
    const expectedNext = deriveMovedSequence(['a', 'b', 'c'], 0, 2);

    expect(confirmRequestedMove(expectedNext, ['b', 'c'])).toBe('rejected');
  });
});

describe('canRollback', () => {
  it('allows rollback when the live sequence matches the expectation and the key exists', () => {
    const expectation = createOrderExpectation(['b', 'c', 'a']);

    expect(canRollback(expectation, ['b', 'c', 'a'], 'a', 0)).toBe(true);
  });

  it('refuses rollback after an incompatible external mutation', () => {
    const expectation = createOrderExpectation(['b', 'c', 'a']);

    expect(canRollback(expectation, ['c', 'b', 'a'], 'a', 0)).toBe(false);
  });

  it('refuses rollback when the active key no longer exists', () => {
    const expectation = createOrderExpectation(['b', 'c']);

    expect(canRollback(expectation, ['b', 'c'], 'a', 0)).toBe(false);
  });
});
