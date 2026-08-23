import { generateItemId, generatePropertyId } from '@shared/lib/databaseDocument';
import { describe, expect, it, vi } from 'vitest';
import { useDatabaseInlineEditSession } from './useDatabaseInlineEditSession';

describe('useDatabaseInlineEditSession', () => {
  it('returns failed resolution and keeps the exact draft recoverable after persistence rejects', async () => {
    const postValue = vi.fn().mockRejectedValue(new Error('write rejected'));
    const itemId = generateItemId();
    const propertyId = generatePropertyId();
    const initialValue = { label: 'initial value' };
    const draft = { label: 'recoverable draft' };
    const session = useDatabaseInlineEditSession(postValue);

    await session.request(itemId, propertyId, initialValue);
    session.updateDraft(itemId, propertyId, draft);

    await expect(session.resolve()).resolves.toBe(false);
    expect(postValue).toHaveBeenCalledWith(itemId, propertyId, draft);

    const recovered = session.getSession(itemId, propertyId);
    expect(recovered?.draft).toBe(draft);
    expect(recovered?.resolving).toBe(false);
  });
});
