import { EventEmitter } from 'node:events';
import process from 'node:process';

import { describe, expect, it, afterEach, vi } from 'vitest';

import { createChildSignalForwarder } from './signalForward.mjs';

const forwarders = [];

afterEach(() => {
  for (const f of forwarders) {
    f.cleanup();
  }

  forwarders.length = 0;
});

/**
 * Call the forwarder's onParentSignal directly instead of relying on
 * process.emit('SIGINT') which does not reliably trigger once-listeners in
 * vitest worker threads.
 * @param forwarder
 * @param signal
 */
function emitParentSignal(forwarder, signal) {
  forwarder.onParentSignal(signal);
}

describe('createChildSignalForwarder', () => {
  function makeForwarder() {
    const child = new EventEmitter();
    child.kill = vi.fn();
    const f = createChildSignalForwarder(child);
    forwarders.push(f);
    return { child, forwarder: f };
  }

  it('adds SIGINT and SIGTERM listeners on the parent process', () => {
    const { forwarder } = makeForwarder();

    expect(process.listeners('SIGINT')).toContain(forwarder.onParentSignal);
    expect(process.listeners('SIGTERM')).toContain(forwarder.onParentSignal);

    forwarder.cleanup();
  });

  it('forwards SIGINT to the child when the child is still alive', () => {
    const { child, forwarder } = makeForwarder();

    emitParentSignal(forwarder, 'SIGINT');

    expect(forwarder.terminatedBySignal).toBe('SIGINT');
    expect(child.kill).toHaveBeenCalledWith('SIGINT');
  });

  it('forwards SIGTERM to the child when the child is still alive', () => {
    const { child, forwarder } = makeForwarder();

    emitParentSignal(forwarder, 'SIGTERM');

    expect(forwarder.terminatedBySignal).toBe('SIGTERM');
    expect(child.kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('ignores duplicate signals (only first signal is forwarded)', () => {
    const { child, forwarder } = makeForwarder();

    emitParentSignal(forwarder, 'SIGINT');
    emitParentSignal(forwarder, 'SIGTERM'); // Second signal should be ignored

    expect(forwarder.terminatedBySignal).toBe('SIGINT');
    expect(child.kill).toHaveBeenCalledTimes(1);
    expect(child.kill).toHaveBeenCalledWith('SIGINT');
  });

  it('schedules self-signal via setImmediate when child is already closed', async () => {
    const { child, forwarder } = makeForwarder();

    // Mark child as already closed
    forwarder.childClosed = true;

    // Use fake timers BEFORE calling handler so setImmediate is intercepted
    vi.useFakeTimers();

    const killSpy = vi.spyOn(process, 'kill').mockImplementation(() => {});

    emitParentSignal(forwarder, 'SIGINT');

    expect(forwarder.terminatedBySignal).toBe('SIGINT');
    expect(child.kill).toHaveBeenCalledWith('SIGINT');

    // process.kill should NOT be called directly (scheduled via mocked setImmediate)
    expect(killSpy).not.toHaveBeenCalled();

    // Flush the mocked setImmediate
    await vi.runAllTimersAsync();

    expect(killSpy).toHaveBeenCalledWith(process.pid, 'SIGINT');

    killSpy.mockRestore();
    vi.useRealTimers();
  });

  it('cleanup removes signal listeners', () => {
    const { forwarder } = makeForwarder();

    expect(process.listeners('SIGINT')).toContain(forwarder.onParentSignal);
    expect(process.listeners('SIGTERM')).toContain(forwarder.onParentSignal);

    forwarder.cleanup();

    expect(process.listeners('SIGINT')).not.toContain(forwarder.onParentSignal);
    expect(process.listeners('SIGTERM')).not.toContain(forwarder.onParentSignal);
  });

  it('cleanup is safe to call multiple times', () => {
    const { forwarder } = makeForwarder();

    expect(process.listeners('SIGINT')).toContain(forwarder.onParentSignal);

    forwarder.cleanup();
    expect(process.listeners('SIGINT')).not.toContain(forwarder.onParentSignal);

    forwarder.cleanup(); // Second call should not throw or change anything
    expect(process.listeners('SIGINT')).not.toContain(forwarder.onParentSignal);
  });
});
