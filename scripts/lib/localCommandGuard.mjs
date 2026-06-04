import process from 'node:process';

import {
  formatLockBusyMessage,
  getVerifyLockStatus,
  withExpensiveCommandLock,
} from './commandLock.mjs';
import { runLocalCommand } from './runLocalCommand.mjs';

const VERIFY_LOCK_ENV_FLAG = 'MIOFRAME_VERIFY_LOCK_HELD';

const defaultDeps = {
  getVerifyLockStatus,
  runLocalCommand,
  withExpensiveCommandLock,
};

function resolveDeps(deps = {}) {
  return {
    ...defaultDeps,
    ...deps,
  };
}

function isGitHubActions(processEnv = process.env) {
  return processEnv.GITHUB_ACTIONS === 'true';
}

function shouldBypassVerifyGuard(processEnv = process.env) {
  return isGitHubActions(processEnv) || processEnv[VERIFY_LOCK_ENV_FLAG] === '1';
}

/**
 * Fail fast when a standalone local command is started while pnpm verify owns the top-level lock.
 * Commands launched from inside `pnpm verify` and GitHub Actions intentionally skip this guard.
 * @param [options] Optional testing overrides.
 * @param [options.lockDirectoryPath] Override the verify lock path.
 * @param [options.processEnv] Environment variables to inspect for skip behavior.
 * @param [options.staleAfterMs] Override the verify stale threshold.
 * @param [deps] Dependency overrides for tests.
 */
export function assertNoActiveVerifyLock(options = {}, deps = defaultDeps) {
  const resolvedDeps = resolveDeps(deps);
  const { processEnv = process.env, ...lockStatusOptions } = options;

  if (shouldBypassVerifyGuard(processEnv)) {
    return;
  }

  const status = resolvedDeps.getVerifyLockStatus(lockStatusOptions);

  if (status.state !== 'active') {
    return;
  }

  throw new Error(
    formatLockBusyMessage('verify', status.metadata, {
      lockDirectoryPath: status.lockPath,
      staleAfterMs: lockStatusOptions.staleAfterMs,
    }),
  );
}

/**
 * Run a local command only when no competing top-level verify is active.
 * @param input Guarded command description.
 * @param input.command Display command for diagnostics.
 * @param [input.executable] Executable for the default local-command runner.
 * @param input.label Verification label for diagnostics.
 * @param [input.args] CLI arguments when using the default local-command runner.
 * @param [input.env] Child process environment when using the default runner.
 * @param [input.run] Custom callback used instead of the default local-command runner.
 * @param [deps] Dependency overrides for tests.
 * @param [deps.assertNoActiveVerifyLock] Guard override for tests.
 * @param [deps.processEnv] Environment override for tests.
 * @param [deps.runLocalCommand] Local command runner override for tests.
 * @returns Normalized child-process result.
 */
export async function runGuardedLocalCommand(input, deps = defaultDeps) {
  const resolvedDeps = resolveDeps(deps);
  const assertVerifyLock = resolvedDeps.assertNoActiveVerifyLock ?? assertNoActiveVerifyLock;
  const runCommand = resolvedDeps.runLocalCommand;
  assertVerifyLock({ processEnv: resolvedDeps.processEnv }, resolvedDeps);

  if (input.run) {
    return input.run({}, undefined);
  }

  return runCommand({
    command: input.executable ?? input.command,
    args: input.args ?? [],
    env: input.env ?? process.env,
  });
}

/**
 * Run a local command under verify coordination and the expensive-command lock.
 * @param input Guarded command description.
 * @param input.command Display command for diagnostics.
 * @param [input.executable] Executable for the default local-command runner.
 * @param input.label Verification label for diagnostics.
 * @param [input.args] CLI arguments when using the default local-command runner.
 * @param [input.cwd] Working directory metadata for the expensive lock.
 * @param [input.env] Child process environment when using the default runner.
 * @param [input.logPath] Log path metadata for the expensive lock.
 * @param [input.run] Custom callback used instead of the default local-command runner.
 * @param [deps] Dependency overrides for tests.
 * @param [deps.assertNoActiveVerifyLock] Guard override for tests.
 * @param [deps.processEnv] Environment override for tests.
 * @param [deps.runLocalCommand] Local command runner override for tests.
 * @param [deps.withExpensiveCommandLock] Expensive-lock override for tests.
 * @returns Normalized child-process result.
 */
export async function runGuardedExpensiveLocalCommand(input, deps = defaultDeps) {
  const resolvedDeps = resolveDeps(deps);
  const assertVerifyLock = resolvedDeps.assertNoActiveVerifyLock ?? assertNoActiveVerifyLock;
  const runCommand = resolvedDeps.runLocalCommand;
  const withLock = resolvedDeps.withExpensiveCommandLock;
  assertVerifyLock({ processEnv: resolvedDeps.processEnv }, resolvedDeps);

  return withLock(
    {
      command: input.command,
      cwd: input.cwd,
      label: input.label,
      logPath: input.logPath,
    },
    (lockEnv, helpers) => {
      if (input.run) {
        return input.run(lockEnv, helpers);
      }

      return runCommand({
        command: input.executable ?? input.command,
        args: input.args ?? [],
        env: { ...(input.env ?? process.env), ...lockEnv },
      });
    },
  );
}
