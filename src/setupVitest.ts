// Setup file for Vitest

import { afterAll, afterEach } from 'vitest';
import { createVueWarningRecorder } from './vueWarningGuard';

Reflect.set(globalThis, '__APP_VERSION__', 'test');
Reflect.set(globalThis, '__BUILD_DATE__', '1970-01-01T00:00:00.000Z');
Reflect.set(globalThis, '__BUILD_ID__', '');
Reflect.set(globalThis, '__DIAGNOSTICS_MODE__', 'production');

// Mock Worker for tests that use Web Workers (e.g., service workers)
class MockWorker {
  private _onmessage: ((event: MessageEvent) => void) | null = null;
  private _postMessageQueue: unknown[] = [];

  postMessage(msg: unknown): void {
    this._postMessageQueue.push(msg);
  }

  get onmessage(): ((event: MessageEvent) => void) | null {
    return this._onmessage;
  }

  set onmessage(handler: ((event: MessageEvent) => void) | null) {
    this._onmessage = handler;
  }

  terminate(): void {}

  addEventListener(_type: string, _listener: EventListener): void {}
  removeEventListener(_type: string, _listener: EventListener): void {}
}

Object.defineProperty(globalThis, 'Worker', {
  configurable: true,
  value: MockWorker,
});

// Fail unit tests on Vue runtime warnings. Vue emits runtime warnings via
// console.warn with a `[Vue warn]`-prefixed first argument; the recorder
// observes them and every call is still forwarded to the real console.warn,
// so nothing is silenced. A test that intentionally provokes Vue warnings
// must take ownership of console.warn locally (vi.spyOn with a mock
// implementation) for its own duration.
const vueWarningRecorder = createVueWarningRecorder();
const originalConsoleWarn = console.warn.bind(console);

console.warn = (...args: unknown[]) => {
  vueWarningRecorder.record(args);
  originalConsoleWarn(...args);
};

const throwOnRecordedVueWarnings = (phase: string) => {
  const warnings = vueWarningRecorder.drain();

  if (warnings.length > 0) {
    throw new Error(
      `Vue runtime warning detected during ${phase}. Fix the warning; do not suppress it.\n${warnings.join('\n')}`,
    );
  }
};

// Runs after test-file afterEach hooks, so unmount/cleanup warnings are seen.
afterEach(() => {
  throwOnRecordedVueWarnings('a unit test');
});

// Safety net for warnings emitted after the last test's afterEach check.
afterAll(() => {
  throwOnRecordedVueWarnings('test-file teardown');
});
