// Setup file for Vitest

Reflect.set(globalThis, '__APP_VERSION__', 'test');
Reflect.set(globalThis, '__BUILD_DATE__', '1970-01-01T00:00:00.000Z');
Reflect.set(globalThis, '__BUILD_ID__', '');
Reflect.set(globalThis, '__DIAGNOSTICS_MODE__', 'production');
Reflect.set(globalThis, '__MANAGED_APP_UPDATE_CHANNEL__', undefined);

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

// Minimal `ElementInternals` polyfill: happy-dom does not implement
// `HTMLElement.prototype.attachInternals()`. The installed `@m3e/web` Switch renderer
// (`M3eSwitchElement`) uses form-associated mixins that call it synchronously during
// construction, which otherwise throws in every component-contract test that mounts it. This
// provides just enough surface for those mixins to run without throwing; it intentionally does
// not reimplement real browser form participation, validity UI, or accessibility-tree
// behavior, which real-browser Playwright proof covers separately.
class MockElementInternals {
  checkValidity(): boolean {
    return true;
  }

  form = null;
  labels: readonly Element[] = [];
  reportValidity(): boolean {
    return true;
  }

  role: string | null = null;

  setFormValue(): void {}

  setValidity(): void {}

  states = new Set<string>();
  validationMessage = '';
  validity = {
    badInput: false,
    customError: false,
    patternMismatch: false,
    rangeOverflow: false,
    rangeUnderflow: false,
    stepMismatch: false,
    tooLong: false,
    tooShort: false,
    typeMismatch: false,
    valid: true,
    valueMissing: false,
  };
  willValidate = true;
}

if (typeof HTMLElement !== 'undefined' && !('attachInternals' in HTMLElement.prototype)) {
  Object.defineProperty(HTMLElement.prototype, 'attachInternals', {
    configurable: true,
    value(this: HTMLElement) {
      return new MockElementInternals();
    },
    writable: true,
  });
}
