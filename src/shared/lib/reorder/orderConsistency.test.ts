import { describe, expect, it } from 'vitest';
import {
  assertUniqueKeys,
  canRollback,
  checkOrderConsistency,
  confirmRequestedMove,
  decidePointerUpOutcome,
  deriveMovedSequence,
  evaluateRequestedMove,
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

  it('throws for duplicate controlled keys', () => {
    expect(() => {
      assertUniqueKeys(['a', 'b', 'a']);
    }).toThrow(/duplicate controlled keys/);
  });
});

describe('checkOrderConsistency', () => {
  it('is consistent when the live sequence matches confirmedSequence', () => {
    expect(checkOrderConsistency(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe('consistent');
  });

  it('detects an external mutation not requested by this session', () => {
    expect(checkOrderConsistency(['a', 'b', 'c'], ['c', 'b', 'a'])).toBe('external-mutation');
  });

  it('detects an external removal as a mutation', () => {
    expect(checkOrderConsistency(['a', 'b', 'c'], ['a', 'c'])).toBe('external-mutation');
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
  it('allows rollback when the live sequence matches confirmedSequence and the key exists', () => {
    expect(canRollback(['b', 'c', 'a'], ['b', 'c', 'a'], 'a', 0)).toBe(true);
  });

  it('refuses rollback after an incompatible external mutation', () => {
    expect(canRollback(['b', 'c', 'a'], ['c', 'b', 'a'], 'a', 0)).toBe(false);
  });

  it('refuses rollback when the active key no longer exists', () => {
    expect(canRollback(['b', 'c'], ['b', 'c'], 'a', 0)).toBe(false);
  });
});

describe('evaluateRequestedMove', () => {
  it('immediately promotes the confirmed sequence when the consumer adopts the exact request', () => {
    const requested = deriveMovedSequence(['a', 'b', 'c'], 0, 2);

    const outcome = evaluateRequestedMove(requested, ['b', 'c', 'a']);

    expect(outcome).toEqual({ kind: 'accepted', confirmedSequence: ['b', 'c', 'a'] });
  });

  it('rejects immediately when the consumer left the sequence unchanged', () => {
    const requested = deriveMovedSequence(['a', 'b', 'c'], 0, 2);

    expect(evaluateRequestedMove(requested, ['a', 'b', 'c'])).toEqual({ kind: 'rejected' });
  });

  it('rejects immediately when the consumer applied a different change', () => {
    const requested = deriveMovedSequence(['a', 'b', 'c'], 0, 2);

    expect(evaluateRequestedMove(requested, ['c', 'b', 'a'])).toEqual({ kind: 'rejected' });
  });
});

describe('decidePointerUpOutcome', () => {
  it('finishes normally when consistent, no pending request, and not awaiting a DOM commit', () => {
    expect(
      decidePointerUpOutcome({
        confirmedSequence: ['a', 'b'],
        currentKeys: ['a', 'b'],
        pendingRequestedSequence: null,
        awaitingDomCommit: false,
      }),
    ).toBe('finish');
  });

  it('defers completion while awaiting a DOM commit', () => {
    expect(
      decidePointerUpOutcome({
        confirmedSequence: ['a', 'b'],
        currentKeys: ['a', 'b'],
        pendingRequestedSequence: null,
        awaitingDomCommit: true,
      }),
    ).toBe('defer');
  });

  it('cancels when the controlled sequence diverged from confirmedSequence', () => {
    expect(
      decidePointerUpOutcome({
        confirmedSequence: ['a', 'b'],
        currentKeys: ['b', 'a'],
        pendingRequestedSequence: null,
        awaitingDomCommit: false,
      }),
    ).toBe('cancel');
  });

  it('cancels when a requested move is still unresolved, even if the sequence looks consistent', () => {
    expect(
      decidePointerUpOutcome({
        confirmedSequence: ['a', 'b'],
        currentKeys: ['a', 'b'],
        pendingRequestedSequence: ['b', 'a'],
        awaitingDomCommit: false,
      }),
    ).toBe('cancel');
  });

  it('prioritizes the divergence check over the awaiting-commit state', () => {
    expect(
      decidePointerUpOutcome({
        confirmedSequence: ['a', 'b'],
        currentKeys: ['b', 'a'],
        pendingRequestedSequence: null,
        awaitingDomCommit: true,
      }),
    ).toBe('cancel');
  });
});
