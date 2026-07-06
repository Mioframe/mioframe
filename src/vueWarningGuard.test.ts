import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, watch } from 'vue';
import { createVueWarningRecorder, isVueRuntimeWarning } from './vueWarningGuard';

describe('isVueRuntimeWarning', () => {
  it('matches a console.warn call whose first argument starts with the Vue marker', () => {
    expect(isVueRuntimeWarning(['[Vue warn]: Invalid watch source: 0'])).toBe(true);
    expect(isVueRuntimeWarning(['[Vue warn] something', { component: true }])).toBe(true);
  });

  it('does not match the marker in the middle of a message', () => {
    expect(isVueRuntimeWarning(['test does not emit [Vue warn] output'])).toBe(false);
  });

  it('does not match non-string first arguments or empty calls', () => {
    expect(isVueRuntimeWarning([{ message: '[Vue warn]: boxed' }])).toBe(false);
    expect(isVueRuntimeWarning([])).toBe(false);
  });
});

describe('createVueWarningRecorder', () => {
  it('records only Vue runtime warnings and drains them once', () => {
    const recorder = createVueWarningRecorder();

    recorder.record(['[Vue warn]: Invalid watch source: 0']);
    recorder.record(['unrelated warning']);
    recorder.record(['fixture mentioning [Vue warn] mid-string']);

    expect(recorder.drain()).toEqual(['[Vue warn]: Invalid watch source: 0']);
    expect(recorder.drain()).toEqual([]);
  });

  it('formats non-string warning arguments into readable text', () => {
    const recorder = createVueWarningRecorder();

    recorder.record(['[Vue warn]: Invalid watch source:', 0]);

    expect(recorder.drain()).toEqual(['[Vue warn]: Invalid watch source: 0']);
  });

  // Living proof for the verify pipeline: a passing test whose name contains
  // the literal marker must never fail verification by itself.
  it('passes although this test name contains [Vue warn]', () => {
    expect(isVueRuntimeWarning(['clean output'])).toBe(false);
  });
});

describe('Vue runtime warning channel', () => {
  it('emits invalid-watch-source warnings through console.warn during mount', () => {
    // Narrow local override: this test intentionally provokes a Vue warning
    // to prove the console.warn channel assumption, so it takes ownership of
    // console.warn for its own duration instead of feeding the global guard.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const BrokenWatchSource = defineComponent({
        name: 'BrokenWatchSource',
        setup() {
          watch({ scrollTop: 0 } as never, () => {});
          return () => null;
        },
      });

      mount(BrokenWatchSource);

      const vueWarnCall = warnSpy.mock.calls.find((call) => isVueRuntimeWarning(call));

      expect(vueWarnCall?.[0]).toContain('[Vue warn]');
      expect(vueWarnCall?.[0]).toContain('Invalid watch source');
    } finally {
      warnSpy.mockRestore();
    }
  });
});
