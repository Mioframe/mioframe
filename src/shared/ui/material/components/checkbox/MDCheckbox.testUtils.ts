/**
 * Minimal Checkbox-owned `ElementInternals` compatibility seam for Vitest's happy-dom
 * environment. happy-dom does not implement `HTMLElement.prototype.attachInternals()`, and the
 * installed `@m3e/web` Checkbox renderer (`M3eCheckboxElement`) uses form-associated mixins that
 * call it synchronously during construction, which otherwise throws whenever a component-contract
 * test mounts it. This provides just enough surface for those mixins to run without throwing; it
 * intentionally does not reimplement real browser form participation, validity UI,
 * accessibility-tree behavior, or focus emulation — those remain real-browser
 * (`MDCheckbox.behavior.spec.ts`) responsibilities.
 *
 * Installed/restored only around Checkbox's own tests (see `MDCheckbox.test.ts`), not globally in
 * `src/setupVitest.ts` and not promoted to a shared Material test-support helper, per
 * ARCHITECTURE.md "Implementation passes" #8: this is the second independent family (`switch`,
 * `checkbox`) that needs the identical minimal seam, which meets `docs/component-adapter.md`'s
 * "Test-environment seams" promotion criterion in principle, but promoting it would require
 * editing the already-complete, independently reviewed `switch` family's owned test file
 * (`../switch/MDSwitch.testUtils.ts`) from this implementation-only worker — out of scope for a
 * single-family implementation stage that must not touch another family's owned artifacts. The
 * family-local duplicate below is byte-for-byte the same minimal seam as Switch's, so promotion
 * remains a pure follow-up refactor with no behavior change whenever an operator explicitly
 * chooses to do it.
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
export function installCheckboxElementInternalsShim(): () => void {
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
