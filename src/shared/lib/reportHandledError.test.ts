import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { captureExceptionMock, setExtrasMock, setTagMock, withScopeMock } = vi.hoisted(() => {
  const scopeSetTagMock = vi.fn();
  const scopeSetExtrasMock = vi.fn();
  const sentryCaptureExceptionMock = vi.fn();
  const sentryWithScopeMock = vi.fn((callback: (scope: object) => void) => {
    callback({
      setExtras: scopeSetExtrasMock,
      setTag: scopeSetTagMock,
    });
  });

  return {
    captureExceptionMock: sentryCaptureExceptionMock,
    setExtrasMock: scopeSetExtrasMock,
    setTagMock: scopeSetTagMock,
    withScopeMock: sentryWithScopeMock,
  };
});

vi.mock('./setupSentry', () => ({
  useSentry: () => ({
    captureException: captureExceptionMock,
    withScope: withScopeMock,
  }),
}));

describe('reportHandledError', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    captureExceptionMock.mockReset();
    setExtrasMock.mockReset();
    setTagMock.mockReset();
    withScopeMock.mockClear();
  });

  it('reports the DomainError cause and stores the user-facing message', async () => {
    const { DomainError } = await import('@shared/lib/error');
    const { reportHandledError } = await import('./reportHandledError');
    const cause = new Error('write failed');

    reportHandledError(new DomainError('Could not save', { cause }), {
      feature: 'documents',
      action: 'save',
      path: '/docs/a',
    });

    expect(captureExceptionMock).toHaveBeenCalledWith(cause);
    expect(setExtrasMock).toHaveBeenCalledWith({
      path: '/docs/a',
      userMessage: 'Could not save',
    });
  });

  it('reports a regular Error directly', async () => {
    const { reportHandledError } = await import('./reportHandledError');
    const error = new Error('boom');

    reportHandledError(error, {
      feature: 'documents',
      action: 'save',
    });

    expect(captureExceptionMock).toHaveBeenCalledWith(error);
    expect(setExtrasMock).not.toHaveBeenCalled();
  });

  it('wraps a non-Error and preserves the original thrown value', async () => {
    const { reportHandledError } = await import('./reportHandledError');

    reportHandledError('boom', {
      feature: 'documents',
      action: 'save',
    });

    expect(captureExceptionMock).toHaveBeenCalledWith(expect.any(Error));
    expect(captureExceptionMock.mock.calls[0]?.[0]).toMatchObject({
      message: 'Handled non-error exception',
    });
    expect(setExtrasMock).toHaveBeenCalledWith({
      originalError: 'boom',
    });
  });

  it('never throws while reporting', async () => {
    const { reportHandledError } = await import('./reportHandledError');

    expect(() => {
      reportHandledError(new Error('boom'), {
        feature: 'documents',
        action: 'save',
      });
    }).not.toThrow();
  });
});
