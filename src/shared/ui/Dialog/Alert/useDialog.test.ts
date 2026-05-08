import { beforeEach, describe, expect, it, vi } from 'vitest';

type DialogModule = typeof import('./useDialog');

const loadDialogModule = async (): Promise<DialogModule> => {
  vi.resetModules();
  return await import('./useDialog');
};

describe('useDialogState', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows parallel confirm dialogs one by one and resolves each promise with its own result', async () => {
    const { useDialog, useDialogState } = await loadDialogModule();
    const { confirm } = useDialog();
    const state = useDialogState();

    const firstPromise = confirm('First headline', 'First body');
    const secondPromise = confirm('Second headline', 'Second body');

    expect([...state.alertSet]).toHaveLength(1);
    expect([...state.alertSet].map((dialog) => dialog.headline)).toEqual(['First headline']);

    const firstDialog = [...state.alertSet][0];
    firstDialog?.callback(true);

    await Promise.resolve();

    expect(await firstPromise).toBe(true);
    expect([...state.alertSet]).toHaveLength(1);
    expect([...state.alertSet].map((dialog) => dialog.headline)).toEqual(['Second headline']);

    const secondDialog = [...state.alertSet][0];
    secondDialog?.callback(false);

    await expect(secondPromise).resolves.toBe(false);
    expect([...state.alertSet]).toHaveLength(0);
  });

  it('uses one FIFO queue for alert and confirm dialogs', async () => {
    const { useDialog, useDialogState } = await loadDialogModule();
    const { alert, confirm } = useDialog();
    const state = useDialogState();

    const firstPromise = alert('Alert headline', 'Alert body');
    const secondPromise = confirm('Confirm headline', 'Confirm body');
    const thirdPromise = alert('Final headline', 'Final body');

    expect([...state.alertSet].map((dialog) => dialog.headline)).toEqual(['Alert headline']);

    [...state.alertSet][0]?.callback(true);
    await Promise.resolve();

    expect(await firstPromise).toBe(true);
    expect([...state.alertSet].map((dialog) => dialog.headline)).toEqual(['Confirm headline']);

    [...state.alertSet][0]?.callback(false);
    await Promise.resolve();

    expect(await secondPromise).toBe(false);
    expect([...state.alertSet].map((dialog) => dialog.headline)).toEqual(['Final headline']);

    [...state.alertSet][0]?.callback(true);

    await expect(thirdPromise).resolves.toBe(true);
    expect([...state.alertSet]).toHaveLength(0);
  });
});
