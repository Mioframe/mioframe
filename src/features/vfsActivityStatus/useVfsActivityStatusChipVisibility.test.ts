import { describe, expect, it } from 'vitest';
import type { VfsActivityState } from '@shared/lib/virtualFileSystem';
import { getVfsActivityStatusChipVisibility } from './useVfsActivityStatusChipVisibility';

const createState = (overrides: Partial<VfsActivityState> = {}): VfsActivityState => ({
  status: 'idle',
  activeCount: 0,
  ...overrides,
});

describe('getVfsActivityStatusChipVisibility', () => {
  it('hides the chip while the activity state is idle', () => {
    expect(
      getVfsActivityStatusChipVisibility(createState(), {
        hasUnacknowledgedError: false,
      }),
    ).toBeUndefined();
  });

  it('shows Saving for active activity', () => {
    expect(
      getVfsActivityStatusChipVisibility(createState({ status: 'active', activeCount: 1 }), {
        hasUnacknowledgedError: false,
      }),
    ).toBe('active');
  });

  it('shows Save failed only for unacknowledged errors', () => {
    expect(
      getVfsActivityStatusChipVisibility(
        createState({
          status: 'error',
          lastError: {
            operationType: 'writeFile',
            path: '/private.txt',
            message: 'write failed',
            occurredAt: 1,
            acknowledged: false,
          },
        }),
        { hasUnacknowledgedError: true },
      ),
    ).toBe('error');

    expect(
      getVfsActivityStatusChipVisibility(
        createState({
          status: 'error',
          lastError: {
            operationType: 'writeFile',
            path: '/private.txt',
            message: 'write failed',
            occurredAt: 1,
            acknowledged: true,
          },
        }),
        { hasUnacknowledgedError: false },
      ),
    ).toBeUndefined();
  });
});
