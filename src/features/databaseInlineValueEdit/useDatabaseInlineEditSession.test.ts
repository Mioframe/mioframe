import { generateItemId, generatePropertyId } from '@shared/lib/databaseDocument';
import type { AMDocumentId } from '@shared/lib/automerge';
import { Repo } from '@automerge/automerge-repo';
import { ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDatabaseInlineEditSession } from './useDatabaseInlineEditSession';

const postValue = vi.fn();

vi.mock('@entity/databaseValue', () => ({
  useDatabaseValueWrite: () => ({ postValue }),
}));

describe('useDatabaseInlineEditSession', () => {
  const createDocumentId = (): AMDocumentId => new Repo().create({}).documentId;

  beforeEach(() => {
    postValue.mockReset();
  });

  const createSession = () =>
    useDatabaseInlineEditSession(ref('/database'), ref(createDocumentId()));

  const createCell = () => ({ itemId: generateItemId(), propertyId: generatePropertyId() });

  it('looks up only the exact active cell and keeps a same-cell request stable', async () => {
    const { itemId, propertyId } = createCell();
    const session = createSession();
    const initialValue = { label: 'initial' };
    const draft = { label: 'draft' };

    await session.request(itemId, propertyId, initialValue);
    session.updateDraft(itemId, propertyId, draft);
    await session.request(itemId, propertyId, { label: 'replacement' });

    expect(session.getSession(itemId, propertyId)).toEqual({ draft, resolving: false });
    expect(session.getSession(itemId, generatePropertyId())).toBeUndefined();
    expect(session.getSession(generateItemId(), propertyId)).toBeUndefined();
    expect(postValue).not.toHaveBeenCalled();
  });

  it('resolves an empty or unchanged session without writing', async () => {
    const session = createSession();
    expect(await session.resolve()).toBe(true);
    expect(postValue).not.toHaveBeenCalled();

    const { itemId, propertyId } = createCell();
    await session.request(itemId, propertyId, 'same');
    expect(await session.resolve()).toBe(true);
    expect(session.getSession(itemId, propertyId)).toBeUndefined();
    expect(postValue).not.toHaveBeenCalled();
  });

  it('writes changed drafts exactly once and clears the session', async () => {
    const { itemId, propertyId } = createCell();
    const session = createSession();
    await session.request(itemId, propertyId, 'initial');
    session.updateDraft(itemId, propertyId, 'changed');

    await expect(session.resolve()).resolves.toBe(true);
    expect(postValue).toHaveBeenCalledOnce();
    expect(postValue).toHaveBeenCalledWith(itemId, propertyId, 'changed');
    expect(session.getSession(itemId, propertyId)).toBeUndefined();
  });

  it('serializes concurrent resolves and releases the completed operation', async () => {
    let finishWrite!: () => void;
    postValue.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishWrite = resolve;
        }),
    );
    const { itemId, propertyId } = createCell();
    const session = createSession();
    await session.request(itemId, propertyId, 'initial');
    session.updateDraft(itemId, propertyId, 'changed');

    const first = session.resolve();
    const second = session.resolve();
    session.updateDraft(itemId, propertyId, 'ignored');
    session.cancel(itemId, propertyId);
    expect(second).toBe(first);
    expect(postValue).toHaveBeenCalledOnce();
    expect(session.getSession(itemId, propertyId)).toEqual({ draft: 'changed', resolving: true });

    finishWrite();
    await expect(first).resolves.toBe(true);
    expect(session.getSession(itemId, propertyId)).toBeUndefined();
    await session.request(itemId, propertyId, 'later');
    expect(session.getSession(itemId, propertyId)).toEqual({ draft: 'later', resolving: false });
  });

  it('resolves the previous cell before opening a new cell', async () => {
    let finishWrite!: () => void;
    postValue.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishWrite = resolve;
        }),
    );
    const firstCell = createCell();
    const secondCell = createCell();
    const session = createSession();
    await session.request(firstCell.itemId, firstCell.propertyId, 'A');
    session.updateDraft(firstCell.itemId, firstCell.propertyId, 'A*');

    const requestB = session.request(secondCell.itemId, secondCell.propertyId, 'B');
    expect(session.getSession(firstCell.itemId, firstCell.propertyId)).toEqual({
      draft: 'A*',
      resolving: true,
    });
    expect(session.getSession(secondCell.itemId, secondCell.propertyId)).toBeUndefined();
    finishWrite();
    await requestB;
    expect(postValue).toHaveBeenCalledWith(firstCell.itemId, firstCell.propertyId, 'A*');
    expect(session.getSession(secondCell.itemId, secondCell.propertyId)).toEqual({
      draft: 'B',
      resolving: false,
    });
  });

  it('keeps a failed previous cell recoverable and permits switching after retry', async () => {
    postValue.mockRejectedValueOnce(new Error('write rejected')).mockResolvedValueOnce(undefined);
    const firstCell = createCell();
    const secondCell = createCell();
    const session = createSession();
    await session.request(firstCell.itemId, firstCell.propertyId, 'A');
    session.updateDraft(firstCell.itemId, firstCell.propertyId, 'A*');

    await session.request(secondCell.itemId, secondCell.propertyId, 'B');
    expect(session.getSession(firstCell.itemId, firstCell.propertyId)).toEqual({
      draft: 'A*',
      resolving: false,
    });
    expect(session.getSession(secondCell.itemId, secondCell.propertyId)).toBeUndefined();
    expect(await session.resolve()).toBe(true);
    await session.request(secondCell.itemId, secondCell.propertyId, 'B');
    expect(session.getSession(secondCell.itemId, secondCell.propertyId)).toEqual({
      draft: 'B',
      resolving: false,
    });
  });

  it('guards update, commit, and cancel by cell identity and resolving state', async () => {
    const cell = createCell();
    const wrongCell = createCell();
    const session = createSession();
    await session.request(cell.itemId, cell.propertyId, 'initial');
    session.updateDraft(wrongCell.itemId, wrongCell.propertyId, 'wrong');
    session.cancel(wrongCell.itemId, wrongCell.propertyId);
    expect(session.getSession(cell.itemId, cell.propertyId)).toEqual({
      draft: 'initial',
      resolving: false,
    });

    session.commit(wrongCell.itemId, wrongCell.propertyId);
    expect(postValue).not.toHaveBeenCalled();
    session.updateDraft(cell.itemId, cell.propertyId, 'changed');
    session.commit(cell.itemId, cell.propertyId);
    expect(session.getSession(cell.itemId, cell.propertyId)?.resolving).toBe(true);
    session.updateDraft(cell.itemId, cell.propertyId, 'ignored');
    session.cancel(cell.itemId, cell.propertyId);
    await vi.waitFor(() => {
      expect(postValue).toHaveBeenCalledOnce();
    });
    await session.resolve();
    expect(session.getSession(cell.itemId, cell.propertyId)).toBeUndefined();
  });

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
