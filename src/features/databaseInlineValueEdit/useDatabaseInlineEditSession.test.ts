import { generateItemId, generatePropertyId } from '@shared/lib/databaseDocument';
import type { AMDocumentId } from '@shared/lib/automerge';
import { Repo } from '@automerge/automerge-repo';
import { ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { useDatabaseInlineEditSession } from './useDatabaseInlineEditSession';

const postValue = vi.fn();

vi.mock('@entity/databaseValue', () => ({
  useDatabaseValueWrite: () => ({ postValue }),
}));

describe('useDatabaseInlineEditSession', () => {
  const createDocumentId = (): AMDocumentId => new Repo().create({}).documentId;

  it('keeps the exact draft while a deferred write is resolving and restores it after rejection', async () => {
    let rejectWrite!: (reason?: unknown) => void;
    postValue.mockImplementationOnce(
      () =>
        new Promise<never>((_resolve, reject) => {
          rejectWrite = reject;
        }),
    );
    const itemId = generateItemId();
    const propertyId = generatePropertyId();
    const initialValue = { label: 'initial value' };
    const draft = { label: 'deferred draft' };
    const session = useDatabaseInlineEditSession(ref('/database'), ref(createDocumentId()));

    await session.request(itemId, propertyId, initialValue);
    session.updateDraft(itemId, propertyId, draft);

    const resolution = session.resolve();
    expect(session.getSession(itemId, propertyId)).toEqual({ draft, resolving: true });

    rejectWrite(new Error('write rejected'));

    await expect(resolution).resolves.toBe(false);
    expect(session.getSession(itemId, propertyId)).toEqual({ draft, resolving: false });
  });

  it('returns failed resolution and keeps the exact draft recoverable after persistence rejects', async () => {
    postValue.mockRejectedValueOnce(new Error('write rejected'));
    const itemId = generateItemId();
    const propertyId = generatePropertyId();
    const initialValue = { label: 'initial value' };
    const draft = { label: 'recoverable draft' };
    const session = useDatabaseInlineEditSession(ref('/database'), ref(createDocumentId()));

    await session.request(itemId, propertyId, initialValue);
    session.updateDraft(itemId, propertyId, draft);

    await expect(session.resolve()).resolves.toBe(false);
    expect(postValue).toHaveBeenCalledWith(itemId, propertyId, draft);

    const recovered = session.getSession(itemId, propertyId);
    expect(recovered?.draft).toBe(draft);
    expect(recovered?.resolving).toBe(false);
  });
});
