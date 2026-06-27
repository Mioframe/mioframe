import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

const isFinished = ref(true);
const diagnosticsEnabled = ref(false);
const isDiagnosticsErrorPromptDismissed = ref(false);
const enableDiagnosticsFromErrorPrompt = vi.fn();
const dismissDiagnosticsErrorPrompt = vi.fn();
let sentryDiagnosticsAvailable = true;

vi.mock('@entity/localSettings', () => ({
  useLocalSettings: () => ({ isFinished }),
  useDiagnosticsSettings: () => ({
    diagnosticsEnabled,
    isDiagnosticsErrorPromptDismissed,
    enableDiagnosticsFromErrorPrompt,
    dismissDiagnosticsErrorPrompt,
  }),
}));

vi.mock('@shared/config', () => ({
  get SENTRY_DIAGNOSTICS_AVAILABLE() {
    return sentryDiagnosticsAvailable;
  },
}));

describe('useDiagnosticsErrorPrompt', () => {
  beforeEach(() => {
    vi.resetModules();
    isFinished.value = true;
    diagnosticsEnabled.value = false;
    isDiagnosticsErrorPromptDismissed.value = false;
    sentryDiagnosticsAvailable = true;
    enableDiagnosticsFromErrorPrompt.mockReset();
    dismissDiagnosticsErrorPrompt.mockReset();
  });

  it('is hidden until a handled error requests this placement', async () => {
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    const { isVisible } = useDiagnosticsErrorPrompt('inline');
    expect(isVisible.value).toBe(false);

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt({
      source: 'spaceCreate',
      placement: 'inline',
    });
    expect(isVisible.value).toBe(true);
  });

  it('inline target ignores a pending home-placement request', async () => {
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt({
      source: 'spaceOpen',
      placement: 'home',
    });

    expect(useDiagnosticsErrorPrompt('inline').isVisible.value).toBe(false);
  });

  it('home target ignores a pending inline-placement request', async () => {
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt({
      source: 'spaceCreate',
      placement: 'inline',
    });

    expect(useDiagnosticsErrorPrompt('home').isVisible.value).toBe(false);
  });

  it('home target becomes visible for a pending home-placement request', async () => {
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt({
      source: 'entryRemove',
      placement: 'home',
    });

    expect(useDiagnosticsErrorPrompt('home').isVisible.value).toBe(true);
  });

  it('stays hidden when diagnostics are unavailable', async () => {
    sentryDiagnosticsAvailable = false;
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt({
      source: 'spaceCreate',
      placement: 'inline',
    });
    expect(useDiagnosticsErrorPrompt('inline').isVisible.value).toBe(false);
  });

  it('stays hidden when settings are not yet hydrated', async () => {
    isFinished.value = false;
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt({
      source: 'spaceCreate',
      placement: 'inline',
    });
    expect(useDiagnosticsErrorPrompt('inline').isVisible.value).toBe(false);
  });

  it('stays hidden when diagnostics are already enabled', async () => {
    diagnosticsEnabled.value = true;
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt({
      source: 'spaceCreate',
      placement: 'inline',
    });
    expect(useDiagnosticsErrorPrompt('inline').isVisible.value).toBe(false);
  });

  it('stays hidden when already dismissed for the current app version', async () => {
    isDiagnosticsErrorPromptDismissed.value = true;
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt({
      source: 'spaceCreate',
      placement: 'inline',
    });
    expect(useDiagnosticsErrorPrompt('inline').isVisible.value).toBe(false);
  });

  it('enableDiagnostics enables diagnostics and hides the prompt', async () => {
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt({
      source: 'spaceCreate',
      placement: 'inline',
    });
    const prompt = useDiagnosticsErrorPrompt('inline');
    expect(prompt.isVisible.value).toBe(true);

    prompt.enableDiagnostics();

    expect(enableDiagnosticsFromErrorPrompt).toHaveBeenCalledTimes(1);
    expect(prompt.isVisible.value).toBe(false);
  });

  it('clearing the request hides the prompt and prevents stale display for a later context', async () => {
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt({
      source: 'spaceCreate',
      placement: 'inline',
    });
    const prompt = useDiagnosticsErrorPrompt('inline');
    expect(prompt.isVisible.value).toBe(true);

    prompt.clearDiagnosticsErrorPromptRequest();

    expect(prompt.isVisible.value).toBe(false);
    expect(enableDiagnosticsFromErrorPrompt).not.toHaveBeenCalled();
    expect(dismissDiagnosticsErrorPrompt).not.toHaveBeenCalled();

    // A later, unrelated local owner must not see the earlier request resurface.
    expect(useDiagnosticsErrorPrompt('inline').isVisible.value).toBe(false);
  });

  it('a scoped inline clear does not drop a pending home-placement request', async () => {
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt({
      source: 'documentImport',
      placement: 'home',
    });

    const inlinePrompt = useDiagnosticsErrorPrompt('inline');
    inlinePrompt.clearDiagnosticsErrorPromptRequest();

    expect(useDiagnosticsErrorPrompt('home').isVisible.value).toBe(true);
  });

  it('a scoped clear with a mismatched source leaves a same-placement pending request', async () => {
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt({
      source: 'documentImport',
      placement: 'home',
    });

    const homePrompt = useDiagnosticsErrorPrompt('home');
    homePrompt.clearDiagnosticsErrorPromptRequest({ source: 'entryRemove' });

    expect(homePrompt.isVisible.value).toBe(true);
  });

  it('a scoped clear matching placement and source drops the pending request', async () => {
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt({
      source: 'documentImport',
      placement: 'home',
    });

    const homePrompt = useDiagnosticsErrorPrompt('home');
    homePrompt.clearDiagnosticsErrorPromptRequest({ source: 'documentImport' });

    expect(homePrompt.isVisible.value).toBe(false);
  });

  it('enableDiagnostics clears a pending request regardless of placement', async () => {
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt({
      source: 'documentImport',
      placement: 'home',
    });

    useDiagnosticsErrorPrompt('inline').enableDiagnostics();

    expect(useDiagnosticsErrorPrompt('home').isVisible.value).toBe(false);
  });

  it('dismiss does not enable diagnostics and hides the prompt', async () => {
    const { useDiagnosticsErrorPrompt } = await import('./useDiagnosticsErrorPrompt');
    const { useDiagnosticsErrorPromptTrigger } = await import('./useDiagnosticsErrorPromptTrigger');

    useDiagnosticsErrorPromptTrigger().requestDiagnosticsErrorPrompt({
      source: 'spaceCreate',
      placement: 'inline',
    });
    const prompt = useDiagnosticsErrorPrompt('inline');

    prompt.dismiss();

    expect(dismissDiagnosticsErrorPrompt).toHaveBeenCalledTimes(1);
    expect(enableDiagnosticsFromErrorPrompt).not.toHaveBeenCalled();
    expect(prompt.isVisible.value).toBe(false);
  });
});
