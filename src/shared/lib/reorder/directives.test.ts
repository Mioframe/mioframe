import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ObjectDirective } from 'vue';
import { createReorderDirectives } from './directives';
import { createReorderRegistry, registerItem, type ReorderRegistry } from './registry';
import type { PointerSession } from './PointerSession';

/**
 * Focused, isolated tests for the three directives' own registration/teardown ownership —
 * decoupled from `PointerSession`'s real cancellation logic (covered by `PointerSession.test.ts`)
 * via a minimal fake session that can be told to throw. `vReorderContainer`'s `mounted`/
 * `unmounted` hooks are invoked directly (not through a full Vue mount/unmount) since they never
 * read their `binding`/`vnode` arguments, and a real Vue unmount would route a thrown
 * consumer-boundary error through Vue's own directive-hook error handling (which logs an
 * `[Vue warn]`, unrelated to what this module's own `try`/`finally` teardown is responsible for)
 * instead of leaving it a plain JS exception. Item and ignore registrations are seeded through
 * `registerItem`/`registry.ignoreEls` directly, mirroring what `vReorderItem`/`vReorderIgnore`
 * would have written.
 */

/**
 * @param overrides - Per-method overrides for the fake session, e.g. a throwing `detachContainer`.
 * @returns A minimal `PointerSession` double whose methods are otherwise no-op spies.
 */
const createFakeSession = (
  overrides: Partial<PointerSession<string>> = {},
): PointerSession<string> => ({
  attachContainer: vi.fn(),
  detachContainer: vi.fn(),
  notifyItemUnmounted: vi.fn(),
  dispose: vi.fn(),
  ...overrides,
});

/**
 * @param registry - The registry `vReorderContainer` should write into.
 * @param session - The session `vReorderContainer` should delegate attach/detach to.
 * @returns The container directive's object form, for direct `mounted`/`unmounted` invocation.
 */
const getContainerDirective = (
  registry: ReorderRegistry<string>,
  session: PointerSession<string>,
): ObjectDirective<HTMLElement> => {
  const { vReorderContainer } = createReorderDirectives(registry, session);
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- narrows the broader `Directive` union back to the object form this module always returns.
  return vReorderContainer as ObjectDirective<HTMLElement>;
};

/**
 * @param hook - A directive's `mounted`/`unmounted` hook, which only ever reads `el` in this module.
 * @param el - The element to invoke the hook with.
 */
const callHook = (hook: ObjectDirective<HTMLElement>['mounted'], el: HTMLElement): void => {
  if (!hook) throw new Error('hook is not defined');
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- narrows Vue's real 4-argument hook type to the 1-argument shape this module's hooks actually use.
  (hook as unknown as (el: HTMLElement) => void)(el);
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('vReorderContainer teardown', () => {
  it('clears the complete registry on a successful unmount', () => {
    const registry = createReorderRegistry<string>();
    const session = createFakeSession();
    const vReorderContainer = getContainerDirective(registry, session);
    const containerEl = document.createElement('div');

    callHook(vReorderContainer.mounted, containerEl);
    registerItem(registry, 'a', document.createElement('div'));
    registry.ignoreEls.add(document.createElement('div'));

    callHook(vReorderContainer.unmounted, containerEl);

    expect(session.detachContainer).toHaveBeenCalledWith(containerEl);
    expect(registry.containerEl).toBeNull();
    expect(registry.itemElements.size).toBe(0);
    expect(registry.itemKeys.size).toBe(0);
    expect(registry.ignoreEls.size).toBe(0);
  });

  it('still clears the complete registry when detachContainer throws, and propagates the exact original error', () => {
    const registry = createReorderRegistry<string>();
    const originalError = new Error('consumer callback threw during cancellation');
    const session = createFakeSession({
      detachContainer: vi.fn(() => {
        throw originalError;
      }),
    });
    const vReorderContainer = getContainerDirective(registry, session);
    const containerEl = document.createElement('div');

    callHook(vReorderContainer.mounted, containerEl);
    registerItem(registry, 'a', document.createElement('div'));
    registry.ignoreEls.add(document.createElement('div'));

    let thrown: unknown;
    try {
      callHook(vReorderContainer.unmounted, containerEl);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBe(originalError);
    expect(registry.containerEl).toBeNull();
    expect(registry.itemElements.size).toBe(0);
    expect(registry.itemKeys.size).toBe(0);
    expect(registry.ignoreEls.size).toBe(0);
  });

  it('allows a new container to mount after an exceptional unmount without triggering the duplicate-container invariant', () => {
    const registry = createReorderRegistry<string>();
    const session = createFakeSession({
      detachContainer: vi.fn(() => {
        throw new Error('boom');
      }),
    });
    const vReorderContainer = getContainerDirective(registry, session);
    const firstContainerEl = document.createElement('div');
    const secondContainerEl = document.createElement('div');

    callHook(vReorderContainer.mounted, firstContainerEl);
    expect(() => {
      callHook(vReorderContainer.unmounted, firstContainerEl);
    }).toThrow('boom');

    expect(() => {
      callHook(vReorderContainer.mounted, secondContainerEl);
    }).not.toThrow();
    expect(registry.containerEl).toBe(secondContainerEl);
  });

  it('does not clear a newer container registration when an out-of-order unmount fires for a stale element', () => {
    const registry = createReorderRegistry<string>();
    const session = createFakeSession();
    const vReorderContainer = getContainerDirective(registry, session);
    const staleContainerEl = document.createElement('div');
    const currentContainerEl = document.createElement('div');
    const currentItemEl = document.createElement('div');
    const currentIgnoreEl = document.createElement('div');

    registry.containerEl = currentContainerEl;
    registerItem(registry, 'a', currentItemEl);
    registry.ignoreEls.add(currentIgnoreEl);

    callHook(vReorderContainer.unmounted, staleContainerEl);

    expect(session.detachContainer).not.toHaveBeenCalled();
    expect(registry.containerEl).toBe(currentContainerEl);
    expect(registry.itemElements.get('a')).toBe(currentItemEl);
    expect(registry.ignoreEls.has(currentIgnoreEl)).toBe(true);
  });
});
