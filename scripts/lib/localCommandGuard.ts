import process from 'node:process';

import {
  formatLockBusyMessage,
  getVerifyLockStatus,
  withExpensiveCommandLock,
  type CommandLockHelpers,
  type LockStatusOptions,
} from './commandLock.ts';
import { runLocalCommand } from './runLocalCommand.ts';
import type { ProcessResult } from './processResult.ts';

const VERIFY_LOCK_ENV_FLAG = 'MIOFRAME_VERIFY_LOCK_HELD';

/** Dependency seam for local-command guarding. */
export interface LocalCommandGuardDeps {
  getVerifyLockStatus: typeof getVerifyLockStatus;
  runLocalCommand: typeof runLocalCommand;
  withExpensiveCommandLock: typeof withExpensiveCommandLock;
  assertNoActiveVerifyLock?: typeof assertNoActiveVerifyLock;
  processEnv?: NodeJS.ProcessEnv;
}

const defaultDeps: LocalCommandGuardDeps = {
  getVerifyLockStatus,
  runLocalCommand,
  withExpensiveCommandLock,
};

function resolveDeps(deps: Partial<LocalCommandGuardDeps> = {}): LocalCommandGuardDeps {
  return {
    ...defaultDeps,
    ...deps,
  };
}

function isGitHubActions(processEnv: NodeJS.ProcessEnv = process.env): boolean {
  return processEnv.GITHUB_ACTIONS === 'true';
}

function shouldBypassVerifyGuard(processEnv: NodeJS.ProcessEnv = process.env): boolean {
  return isGitHubActions(processEnv) || processEnv[VERIFY_LOCK_ENV_FLAG] === '1';
}

/** Optional testing overrides for {@link assertNoActiveVerifyLock}. */
export interface AssertNoActiveVerifyLockOptions extends LockStatusOptions {
  /** Environment variables to inspect for skip behavior. */
  processEnv?: NodeJS.ProcessEnv;
}

/**
 * Fail fast when a standalone local command is started while pnpm verify owns the top-level lock.
 * Commands launched from inside `pnpm verify` and GitHub Actions intentionally skip this guard.
 * @param [options] Optional testing overrides.
 * @param [deps] Dependency overrides for tests.
 */
export function assertNoActiveVerifyLock(
  options: AssertNoActiveVerifyLockOptions = {},
  deps: Partial<LocalCommandGuardDeps> = defaultDeps,
): void {
  const resolvedDeps = resolveDeps(deps);
  const { processEnv = process.env, ...lockStatusOptions } = options;

  if (shouldBypassVerifyGuard(processEnv)) {
    return;
  }

  const status = resolvedDeps.getVerifyLockStatus(lockStatusOptions);

  if (status.state !== 'active') {
    return;
  }

  throw new Error(formatLockBusyMessage('verify', status.metadata));
}

/** Guarded command description shared by the local-command guard entrypoints. */
export interface GuardedLocalCommandInput {
  /** Display command for diagnostics. */
  command: string;
  /** Executable for the default local-command runner. */
  executable?: string;
  /** Verification label for diagnostics. */
  label: string;
  /** CLI arguments when using the default local-command runner. */
  args?: readonly string[];
  /** Child process environment when using the default runner. */
  env?: NodeJS.ProcessEnv;
  /** Custom callback used instead of the default local-command runner. */
  run?: (
    lockEnv: Record<string, string>,
    helpers?: CommandLockHelpers,
  ) => ProcessResult | Promise<ProcessResult>;
}

/**
 * Run a local command only when no competing top-level verify is active.
 * @param input Guarded command description.
 * @param [deps] Dependency overrides for tests.
 * @returns Normalized child-process result.
 */
export async function runGuardedLocalCommand(
  input: GuardedLocalCommandInput,
  deps: Partial<LocalCommandGuardDeps> = defaultDeps,
): Promise<ProcessResult> {
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

/** Guarded expensive command description, adding lock metadata fields. */
export interface GuardedExpensiveLocalCommandInput extends GuardedLocalCommandInput {
  /** Working directory metadata for the expensive lock. */
  cwd?: string;
  /** Log path metadata for the expensive lock. */
  logPath?: string;
}

/**
 * Run a local command under verify coordination and the expensive-command lock.
 * @param input Guarded command description.
 * @param [deps] Dependency overrides for tests.
 * @returns Normalized child-process result.
 */
export async function runGuardedExpensiveLocalCommand(
  input: GuardedExpensiveLocalCommandInput,
  deps: Partial<LocalCommandGuardDeps> = defaultDeps,
): Promise<ProcessResult> {
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
