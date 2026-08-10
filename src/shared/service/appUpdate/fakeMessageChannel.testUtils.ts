import { vi } from 'vitest';

type FakeMessageListener = (event: { data: unknown }) => void;

/**
 * A synchronous in-memory fake of a `MessagePort`: `postMessage()` delivers
 * straight to its linked peer's `onmessage`, in the same tick. Real
 * `MessageChannel` port delivery is genuine async I/O, not a JS timer or
 * microtask — under `vi.useFakeTimers()`, `vi.advanceTimersByTimeAsync()`
 * never pumps it, so a real `MessageChannel` can silently never deliver in a
 * faked-timer test. This fake removes that dependency entirely.
 */
class FakeMessagePort {
  onmessage: FakeMessageListener | null = null;
  private peer: FakeMessagePort | undefined;

  postMessage(data: unknown): void {
    this.peer?.onmessage?.({ data });
  }

  close(): void {}

  /**
   * Links this port to its channel counterpart.
   * @internal
   * @param peer - The counterpart port.
   */
  linkTo(peer: FakeMessagePort): void {
    this.peer = peer;
  }
}

/** A synchronous in-memory fake of `MessageChannel`; see {@link FakeMessagePort}. */
class FakeMessageChannel {
  readonly port1 = new FakeMessagePort();
  readonly port2 = new FakeMessagePort();

  constructor() {
    this.port1.linkTo(this.port2);
    this.port2.linkTo(this.port1);
  }
}

/**
 * Stubs the global `MessageChannel` with {@link FakeMessageChannel} so tests
 * can drive probe replies deterministically under `vi.useFakeTimers()`.
 * Callers are responsible for `vi.unstubAllGlobals()` cleanup.
 */
export function stubFakeMessageChannel(): void {
  vi.stubGlobal('MessageChannel', FakeMessageChannel);
}
