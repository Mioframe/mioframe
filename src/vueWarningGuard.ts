/**
 * Unit-test runtime policy helper: detection and recording of Vue runtime
 * warnings emitted through `console.warn`, so the Vitest setup can fail the
 * responsible test instead of letting warnings pass silently.
 *
 * This module is test infrastructure wired from `src/setupVitest.ts`; it must
 * not silence warnings — recording is observation-only and the setup file
 * still forwards every call to the original `console.warn`.
 */

/**
 * Check whether a `console.warn` call is a Vue runtime warning.
 * Anchored to the start of the first argument, so test names, fixture
 * strings, or log text merely containing `[Vue warn]` never match.
 * @param args Arguments passed to `console.warn`.
 * @returns `true` only when the first argument starts with `[Vue warn]`.
 */
export const isVueRuntimeWarning = (args: readonly unknown[]): boolean =>
  typeof args[0] === 'string' && args[0].startsWith('[Vue warn]');

const formatWarningArg = (arg: unknown): string => {
  if (typeof arg === 'string') {
    return arg;
  }

  try {
    return String(arg);
  } catch {
    return '[unprintable value]';
  }
};

/**
 * Create a fresh recorder for Vue runtime warnings observed on
 * `console.warn`. The recorder only stores formatted warning text; it never
 * swallows or rewrites the original call.
 * @returns Recorder with `record` to observe a `console.warn` call and
 * `drain` to take and clear everything recorded so far.
 */
export const createVueWarningRecorder = (): {
  record: (args: readonly unknown[]) => void;
  drain: () => string[];
} => {
  const recorded: string[] = [];

  return {
    record: (args) => {
      if (isVueRuntimeWarning(args)) {
        recorded.push(args.map(formatWarningArg).join(' '));
      }
    },
    drain: () => recorded.splice(0),
  };
};
