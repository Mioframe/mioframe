// Setup file for Vitest

Reflect.set(globalThis, '__APP_VERSION__', 'test');
Reflect.set(globalThis, '__BUILD_DATE__', '1970-01-01T00:00:00.000Z');
Reflect.set(globalThis, '__BUILD_ID__', '');
Reflect.set(globalThis, '__RELEASE_ID__', '0'.repeat(40));
Reflect.set(globalThis, '__RELEASE_SEQUENCE__', '1');
Reflect.set(globalThis, '__RELEASE_TEST_HOOKS__', false);
Reflect.set(globalThis, '__RELEASE_CHANNEL__', 'stable');
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
