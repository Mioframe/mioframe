/**
 * Minimal Switch-owned `ElementInternals` compatibility seam for Vitest's happy-dom environment.
 * happy-dom does not implement `HTMLElement.prototype.attachInternals()`, and the installed
 * `@m3e/web` Switch renderer (`M3eSwitchElement`) uses form-associated mixins that call it
 * synchronously during construction, which otherwise throws whenever a component-contract test
 * mounts it. This provides just enough surface for those mixins to run without throwing; it
 * intentionally does not reimplement real browser form participation, validity UI,
 * accessibility-tree behavior, or focus emulation — those remain real-browser (`MDSwitch.behavior.spec.ts`)
 * responsibilities.
 *
 * Installed/restored only around Switch's own tests (see `MDSwitch.test.ts`), not globally in
 * `src/setupVitest.ts`, per `ARCHITECTURE.md` "Implementation passes" #6: no other current Vitest
 * suite depends on the former global shim (confirmed by inspecting the installed renderer
 * bundle — only `@m3e/web`'s Switch entry references form-associated `ElementInternals` usage
 * among Button, Loading Indicator, and Switch, the only three `m3e-*` elements Mioframe currently
 * selects; see `config/vueCustomElements.ts`).
 */
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

/**
 * Installs the minimal `attachInternals()` polyfill on `HTMLElement.prototype` only when the
 * current environment does not already implement it, preserving any pre-existing implementation
 * untouched. Call from the owning test file's `beforeAll` and call the returned teardown from
 * `afterAll` so the shim never leaks into unrelated suites.
 * @returns A teardown function that restores `HTMLElement.prototype` to its pre-install state.
 */
export function installSwitchElementInternalsShim(): () => void {
  if (typeof HTMLElement === 'undefined' || 'attachInternals' in HTMLElement.prototype) {
    return () => {};
  }

  Object.defineProperty(HTMLElement.prototype, 'attachInternals', {
    configurable: true,
    value(this: HTMLElement) {
      return new MockElementInternals();
    },
    writable: true,
  });

  return () => {
    Reflect.deleteProperty(HTMLElement.prototype, 'attachInternals');
  };
}
