import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBrowserStoragePersistenceFeedback } from './useBrowserStoragePersistenceFeedback';

const { addSnackbarMock } = vi.hoisted(() => ({
  addSnackbarMock: vi.fn(),
}));

vi.mock('@shared/ui/Snackbar', () => ({
  useSnackbar: () => ({
    addSnackbar: addSnackbarMock,
  }),
}));

describe('useBrowserStoragePersistenceFeedback', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows enabled snackbar for "enabled" outcome', () => {
    const { showFeedback } = useBrowserStoragePersistenceFeedback();
    showFeedback('enabled');
    expect(addSnackbarMock).toHaveBeenCalledOnce();
    expect(addSnackbarMock).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'More reliable browser storage enabled.' }),
    );
  });

  it('shows denial snackbar for "not-enabled" outcome', () => {
    const { showFeedback } = useBrowserStoragePersistenceFeedback();
    showFeedback('not-enabled');
    expect(addSnackbarMock).toHaveBeenCalledOnce();
    expect(addSnackbarMock).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('did not enable') }),
    );
  });

  it('shows failure snackbar for "failed" outcome', () => {
    const { showFeedback } = useBrowserStoragePersistenceFeedback();
    showFeedback('failed');
    expect(addSnackbarMock).toHaveBeenCalledOnce();
    expect(addSnackbarMock).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('could not be enabled') }),
    );
  });

  it('shows unavailable snackbar for "unsupported" outcome', () => {
    const { showFeedback } = useBrowserStoragePersistenceFeedback();
    showFeedback('unsupported');
    expect(addSnackbarMock).toHaveBeenCalledOnce();
    expect(addSnackbarMock).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'More reliable storage is unavailable in this browser.' }),
    );
  });

  it('does not show a snackbar for "ignored" outcome', () => {
    const { showFeedback } = useBrowserStoragePersistenceFeedback();
    showFeedback('ignored');
    expect(addSnackbarMock).not.toHaveBeenCalled();
  });
});
