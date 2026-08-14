import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';

import toolingConfig from '../../config/tooling.json' with { type: 'json' };

const machineLockConfig = toolingConfig.verification.machineLock;
const LOCK_METADATA_FILE = 'metadata.json';
const EXPENSIVE_LOCK_ENV_FLAG = 'MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD';
const VERIFY_LOCK_ENV_FLAG = 'MIOFRAME_VERIFY_LOCK_HELD';
const MACHINE_LOCK_ENV_FLAG = 'MIOFRAME_MACHINE_LOCK_HELD';

/** The two kinds of machine lock owner. */
export type LockKind = 'expensive' | 'verify';

/**
 * Lock kinds used for env-flag propagation and error message derivation.
 * The `machine` kind is used internally when acquiring the shared machine lock;
 * `verify` and `expensive` drive message selection based on the stored `kind`
 * field in the machine lock metadata.
 */
const LOCK_KINDS: Record<LockKind, { envFlag: string; label: string }> = {
  expensive: {
    envFlag: EXPENSIVE_LOCK_ENV_FLAG,
    label: 'expensive-command',
  },
  verify: {
    envFlag: VERIFY_LOCK_ENV_FLAG,
    label: 'verify',
  },
};

/** Persisted machine lock metadata. */
export interface LockMetadata {
  /** Structured verify invocation, opaque here; owned by verifyInvocation.ts. */
  verifyInvocation?: unknown;
  kind: LockKind;
  label: string;
  command: string;
  activeCommand?: string;
  activeLabel?: string;
  pid: number;
  hostname: string;
  cwd: string;
  startedAt: string;
  heartbeatAt: string;
  logPath?: string;
  lockPath: string;
  ownerToken: string;
}

/** Persisted metadata read without runtime schema validation. */
type PersistedLockMetadata = Partial<Omit<LockMetadata, 'kind'>> & {
  /** Current and legacy lock kinds read from existing metadata. */
  kind?: unknown;
};

/** Structured machine lock status, discriminated by `state`. */
export type LockStatus =
  | { state: 'missing'; lockPath: string; metadataPath: string; metadata: null; statusReason: null }
  | {
      state: 'active';
      lockPath: string;
      metadataPath: string;
      metadata: PersistedLockMetadata;
      statusReason: null;
    }
  | {
      state: 'stale';
      lockPath: string;
      metadataPath: string;
      metadata: PersistedLockMetadata | null;
      statusReason: string | null;
    }
  | {
      state: 'corrupt';
      lockPath: string;
      metadataPath: string;
      metadata: null;
      statusReason: string;
    };

/** Lock metadata to persist while a guarded command runs. */
export interface CommandLockInput {
  /** Verification label for the lock owner. */
  label: string;
  /** Display command for lock metadata. */
  command: string;
  /** Working directory for lock metadata. */
  cwd?: string;
  /** Associated log file or directory for diagnostics. */
  logPath?: string;
  /** Structured verify invocation used for exact retry recovery. */
  verifyInvocation?: unknown;
}

/** Helpers passed to a guarded command's `run` callback. */
export interface CommandLockHelpers {
  updateMetadata: (partialMetadata?: Partial<LockMetadata>) => void;
}

/** Callback that runs a guarded command; may ignore the lock helpers. */
export type LockCommandRunner<T> = (
  lockEnv: Record<string, string>,
  helpers?: CommandLockHelpers,
) => T | Promise<T>;

/** Optional overrides for lock acquisition (used in testing). */
export interface CommandLockOptions {
  /** Override the machine lock directory path. */
  machineLockDirectoryPath?: string;
  /** Override the stale threshold in ms. */
  staleAfterMs?: number;
  /** Override the heartbeat interval in ms. */
  heartbeatIntervalMs?: number;
  /** When true, bypass the shouldSkipLock check. */
  forceLock?: boolean;
}

function isGitHubActions(processEnv: NodeJS.ProcessEnv = process.env): boolean {
  return processEnv.GITHUB_ACTIONS === 'true';
}

/**
 * @param input Lock metadata to persist while the command is running.
 * @param run Callback that runs the guarded command.
 * @param [options] Optional overrides (used in testing).
 * @returns Callback result after the lock has been released.
 */
export async function withExpensiveCommandLock<T>(
  input: CommandLockInput,
  run: LockCommandRunner<T>,
  options: CommandLockOptions = {},
): Promise<T> {
  return withCommandLock('expensive', input, run, options);
}

/**
 * Run the full local verify CLI under the shared machine lock.
 * @param input Lock metadata to persist while verify is active.
 * @param run Callback that runs the guarded verify process.
 * @param [options] Optional overrides (used in testing).
 * @returns Callback result after the lock has been released.
 */
export async function withVerifyCommandLock<T>(
  input: CommandLockInput,
  run: LockCommandRunner<T>,
  options: CommandLockOptions = {},
): Promise<T> {
  return withCommandLock('verify', input, run, options);
}

function shouldSkipLock(kind: LockKind, processEnv: NodeJS.ProcessEnv = process.env): boolean {
  if (isGitHubActions(processEnv)) {
    return true;
  }

  // Children of the machine-lock owner skip reacquisition to avoid deadlock.
  // MACHINE_LOCK_HELD proves the machine lock is owned by a parent process.
  // VERIFY_LOCK_HELD or EXPENSIVE_LOCK_HELD identifies the owning parent kind.
  if (processEnv[MACHINE_LOCK_ENV_FLAG] === '1' && processEnv[VERIFY_LOCK_ENV_FLAG] === '1') {
    return true;
  }

  // Children of a standalone expensive command (e.g. Playwright webServer spawning storybook
  // build) also skip reacquisition — the parent already holds the machine lock. This must
  // only apply to expensive children: a verify run must never inherit an expensive parent's
  // bypass and skip reacquiring the verify lock.
  if (
    kind === 'expensive' &&
    processEnv[MACHINE_LOCK_ENV_FLAG] === '1' &&
    processEnv[EXPENSIVE_LOCK_ENV_FLAG] === '1'
  ) {
    return true;
  }

  // Legacy: verify children may carry only VERIFY_LOCK_HELD without MACHINE_LOCK_HELD.
  if (kind === 'expensive' && processEnv[VERIFY_LOCK_ENV_FLAG] === '1') {
    return true;
  }

  return false;
}

async function withCommandLock<T>(
  kind: LockKind,
  input: CommandLockInput,
  run: LockCommandRunner<T>,
  options: CommandLockOptions = {},
): Promise<T> {
  const {
    forceLock = false,
    heartbeatIntervalMs: customHeartbeatMs,
    machineLockDirectoryPath,
    staleAfterMs: customStaleAfterMs,
  } = options;

  if (!forceLock && shouldSkipLock(kind)) {
    return withHeldLockEnv(kind, () => run(getHeldLockEnv(kind)));
  }

  const lockDirectoryPath = path.resolve(machineLockDirectoryPath ?? machineLockConfig.directory);
  const metadataPath = path.join(lockDirectoryPath, LOCK_METADATA_FILE);
  const heartbeatIntervalMs = customHeartbeatMs ?? machineLockConfig.heartbeatIntervalMs;
  const staleAfterMs = customStaleAfterMs ?? machineLockConfig.staleAfterMs;

  const ownerToken = crypto.randomUUID();
  const baseMetadata: LockMetadata = {
    ...(input.verifyInvocation === undefined ? {} : { verifyInvocation: input.verifyInvocation }),
    kind,
    label: input.label,
    command: input.command,
    pid: process.pid,
    hostname: os.hostname(),
    cwd: input.cwd ?? process.cwd(),
    startedAt: new Date().toISOString(),
    heartbeatAt: new Date().toISOString(),
    logPath: input.logPath,
    lockPath: lockDirectoryPath,
    ownerToken,
  };
  let currentMetadata = baseMetadata;

  acquireLock({
    lockDirectoryPath,
    metadataPath,
    metadata: currentMetadata,
    requestKind: kind,
    staleAfterMs,
  });

  let released = false;
  const releaseLock = () => releaseOwnedLock(lockDirectoryPath, metadataPath, ownerToken);
  const updateMetadata = (partialMetadata: Partial<LockMetadata> = {}) => {
    currentMetadata = {
      ...currentMetadata,
      ...partialMetadata,
      heartbeatAt: new Date().toISOString(),
    };
    writeMetadata(metadataPath, currentMetadata);
  };
  const heartbeatTimer = setInterval(() => {
    try {
      updateMetadata();
    } catch (heartbeatError) {
      console.error(
        `[machine-lock] heartbeat write failed for \`${input.label}\` at ${metadataPath}: ${
          heartbeatError instanceof Error ? heartbeatError.message : String(heartbeatError)
        }`,
      );
    }
  }, heartbeatIntervalMs);

  const cleanup = () => {
    if (released) {
      return;
    }

    released = true;
    clearInterval(heartbeatTimer);
    releaseLock();
  };

  try {
    return await withHeldLockEnv(kind, () => run(getHeldLockEnv(kind), { updateMetadata }));
  } finally {
    cleanup();
  }
}

function getHeldLockEnv(kind: LockKind): Record<string, string> {
  const env: Record<string, string> = {};

  env[MACHINE_LOCK_ENV_FLAG] = '1';

  if (process.env[VERIFY_LOCK_ENV_FLAG] === '1' || kind === 'verify') {
    env[VERIFY_LOCK_ENV_FLAG] = '1';
  }

  if (process.env[EXPENSIVE_LOCK_ENV_FLAG] === '1' || kind === 'expensive') {
    env[EXPENSIVE_LOCK_ENV_FLAG] = '1';
  }

  return env;
}

async function withHeldLockEnv<T>(kind: LockKind, run: () => T | Promise<T>): Promise<T> {
  const flags = [LOCK_KINDS[kind].envFlag, MACHINE_LOCK_ENV_FLAG];
  const previousValues = Object.fromEntries(flags.map((f) => [f, process.env[f]]));

  for (const flag of flags) {
    process.env[flag] = '1';
  }

  try {
    return await run();
  } finally {
    for (const [flag, prev] of Object.entries(previousValues)) {
      if (prev === undefined) {
        Reflect.deleteProperty(process.env, flag);
      } else {
        process.env[flag] = prev;
      }
    }
  }
}

interface AcquireLockInput {
  lockDirectoryPath: string;
  metadataPath: string;
  metadata: LockMetadata;
  requestKind: LockKind;
  staleAfterMs: number;
}

function acquireLock({
  lockDirectoryPath,
  metadataPath,
  metadata,
  requestKind,
  staleAfterMs,
}: AcquireLockInput): void {
  fs.mkdirSync(path.dirname(lockDirectoryPath), { recursive: true });

  try {
    fs.mkdirSync(lockDirectoryPath, { recursive: false });
    writeMetadata(metadataPath, metadata);
    return;
  } catch (error) {
    if (!isAlreadyExistsError(error)) {
      throw error;
    }
  }

  const existingMetadata = readMetadata(metadataPath);

  if (existingMetadata !== null && isStaleLock(existingMetadata, staleAfterMs)) {
    const removed = releaseOwnedLock(lockDirectoryPath, metadataPath, existingMetadata.ownerToken);

    if (removed) {
      acquireLock({ lockDirectoryPath, metadataPath, metadata, requestKind, staleAfterMs });
      return;
    }
  }

  if (existingMetadata === null && isStaleLockDirectory(lockDirectoryPath, staleAfterMs)) {
    const removed = releaseStaleLockDirectory(lockDirectoryPath);

    if (removed) {
      acquireLock({ lockDirectoryPath, metadataPath, metadata, requestKind, staleAfterMs });
      return;
    }
  }

  const existingKind = existingMetadata?.kind ?? requestKind;
  throw new Error(formatLockBusyMessage(existingKind, existingMetadata, { requestKind }));
}

function isStaleLock(metadata: PersistedLockMetadata, staleAfterMs: number): boolean {
  const heartbeatMs = Date.parse(metadata.heartbeatAt ?? '');

  if (Number.isNaN(heartbeatMs)) {
    return true;
  }

  const heartbeatAgeMs = Date.now() - heartbeatMs;

  if (heartbeatAgeMs <= staleAfterMs) {
    return false;
  }

  if (metadata.hostname !== os.hostname()) {
    return true;
  }

  return !isProcessAlive(metadata.pid);
}

function isProcessAlive(pid: unknown): boolean {
  if (typeof pid !== 'number' || !Number.isInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error !== null && typeof error === 'object' && 'code' in error && error.code === 'EPERM';
  }
}

/**
 * Check whether a lock directory is stale by inspecting its modification time.
 * This is used as a fallback when `metadata.json` is missing or corrupted and
 * the normal owner-token-based stale check cannot run.
 *
 * A directory's mtime is typically set to the creation time when `mkdirSync`
 * creates it, so the directory age is a reasonable proxy for lock age.
 * @param lockDirectoryPath Lock directory to check.
 * @param staleAfterMs Stale threshold in milliseconds.
 * @returns `true` when the directory mtime is older than `staleAfterMs`.
 */
function isStaleLockDirectory(lockDirectoryPath: string, staleAfterMs: number): boolean {
  try {
    const directoryStat = fs.statSync(lockDirectoryPath);

    if (!directoryStat.isDirectory()) {
      return false;
    }

    const directoryAgeMs = Date.now() - directoryStat.mtimeMs;
    return directoryAgeMs > staleAfterMs;
  } catch {
    return false;
  }
}

/**
 * Force-remove a stale lock directory whose metadata is missing or corrupted.
 * This is a last-resort recovery that does not check the owner token because
 * the metadata is not available to verify ownership.
 *
 * Use only when the lock is confirmed stale (e.g. the directory is older than
 * the stale threshold) and the normal owner-token release path cannot apply.
 * @param lockDirectoryPath Lock directory to remove.
 * @returns `true` when the directory was removed, `false` when it was already
 * gone or removal failed.
 */
function releaseStaleLockDirectory(lockDirectoryPath: string): boolean {
  try {
    fs.rmSync(lockDirectoryPath, { recursive: true, force: false });
    return true;
  } catch (error) {
    if (error !== null && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return false;
    }

    return false;
  }
}

/**
 * Removes the lock directory only when the owner token on disk still matches.
 *
 * Re-reads the current on-disk metadata and compares the owner token before
 * removal so a stale-lock recovery does not delete a lock that was already
 * re-acquired by a new owner. Note that there is still a TOCTOU window
 * between the metadata read and `fs.rmSync`; this function does not provide
 * atomic cross-process lock release.
 * @param lockDirectoryPath Lock directory to remove.
 * @param metadataPath Path to the lock metadata file.
 * @param ownerToken Expected owner token from the process that acquired the lock.
 * @returns `true` when the lock was owned and removed, `false` otherwise.
 */
export function releaseOwnedLock(
  lockDirectoryPath: string,
  metadataPath: string,
  ownerToken: unknown,
): boolean {
  const currentMetadata = readMetadata(metadataPath);

  if (currentMetadata === null || currentMetadata.ownerToken !== ownerToken) {
    return false;
  }

  try {
    fs.rmSync(lockDirectoryPath, { recursive: true, force: false });
    return true;
  } catch (error) {
    if (error !== null && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

/**
 * Write lock metadata atomically using a temporary file and rename.
 * Exported for testing.
 * @param metadataPath Target metadata file path.
 * @param metadata Object to serialize as JSON.
 */
export function writeMetadata(metadataPath: string, metadata: LockMetadata): void {
  const payload = JSON.stringify(metadata, null, 2);
  const tempPath = `${metadataPath}.tmp`;
  fs.writeFileSync(tempPath, `${payload}\n`, 'utf8');
  fs.renameSync(tempPath, metadataPath);
}

function readMetadata(metadataPath: string): PersistedLockMetadata | null {
  try {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Derive a human-readable busy message from the existing verification command kind.
 * @param existingKind Persisted kind of the currently-held machine lock.
 * @param metadata Current machine lock metadata, if available.
 * @param [options] Formatting overrides.
 * @returns Human-readable lock-busy message.
 */
export function formatLockBusyMessage(
  existingKind: unknown,
  metadata: PersistedLockMetadata | null | undefined,
  { requestKind }: { requestKind?: LockKind } = {},
): string {
  const busyMessage = deriveBusyMessage(existingKind, requestKind);

  if (metadata === null || metadata === undefined) {
    return [
      busyMessage,
      'Run `pnpm verify:status` and inspect `.verify/logs`.',
      'Do not start another heavy local verification command while the current run is still active.',
    ].join('\n');
  }

  return [
    busyMessage,
    `active command: ${metadata.activeCommand ?? metadata.command ?? 'unknown'}`,
    `startedAt: ${metadata.startedAt ?? 'unknown'}`,
    `logPath: ${metadata.logPath ?? '.verify/logs'}`,
    'Run `pnpm verify:status` for the current verification state.',
    'Do not start another heavy local verification command while the current run is still active.',
  ].join('\n');
}

function deriveBusyMessage(existingKind: unknown, requestKind: LockKind | undefined): string {
  if (existingKind === 'verify' && requestKind === 'expensive') {
    return 'Cannot start expensive local verification command while pnpm verify is already running.';
  }

  if (existingKind === 'expensive' && requestKind === 'verify') {
    return 'Cannot start pnpm verify while an expensive local verification command is already running.';
  }

  if (existingKind === 'verify') {
    return 'Another local pnpm verify is already running.';
  }

  if (existingKind === 'expensive') {
    return 'Another expensive local verification command is already running.';
  }

  return 'Another heavy local verification command is already running.';
}

/**
 * Inspect the current machine lock state without starting verification.
 * @param [options] Optional testing overrides.
 * @returns Structured machine lock status.
 */
export function getMachineLockStatus(options: LockStatusOptions = {}): LockStatus {
  return getLockStatus(options);
}

/**
 * Inspect the current machine lock state as seen by a verify caller.
 * Returns `active` only when the machine lock is held by a `verify` command.
 * @param [options] Optional testing overrides.
 * @returns Structured lock status from the verify perspective.
 */
export function getVerifyLockStatus(options: LockStatusOptions = {}): LockStatus {
  return getMachineLockStatusForKind('verify', options);
}

/**
 * Inspect the current machine lock state as seen by an expensive-command caller.
 * Returns `active` only when the machine lock is held by an `expensive` command.
 * @param [options] Optional testing overrides.
 * @returns Structured lock status from the expensive-command perspective.
 */
export function getExpensiveLockStatus(options: LockStatusOptions = {}): LockStatus {
  return getMachineLockStatusForKind('expensive', options);
}

/** Optional testing overrides for lock status inspection. */
export interface LockStatusOptions {
  /** Override the machine lock path. */
  lockDirectoryPath?: string;
  /** Override the stale threshold. */
  staleAfterMs?: number;
}

function getMachineLockStatusForKind(kind: LockKind, options: LockStatusOptions = {}): LockStatus {
  const status = getLockStatus(options);

  if (status.state === 'active' && status.metadata.kind !== kind) {
    // Machine is active but held by a different command kind — not our kind.
    return {
      lockPath: status.lockPath,
      metadata: null,
      metadataPath: status.metadataPath,
      state: 'missing',
      statusReason: null,
    };
  }

  return status;
}

function getLockStatus(options: LockStatusOptions = {}): LockStatus {
  const lockPath = path.resolve(options.lockDirectoryPath ?? machineLockConfig.directory);
  const metadataPath = path.join(lockPath, LOCK_METADATA_FILE);
  const staleAfterMs = options.staleAfterMs ?? machineLockConfig.staleAfterMs;

  if (!fs.existsSync(lockPath)) {
    return {
      lockPath,
      metadata: null,
      metadataPath,
      state: 'missing',
      statusReason: null,
    };
  }

  if (!fs.statSync(lockPath).isDirectory()) {
    return {
      lockPath,
      metadata: null,
      metadataPath,
      state: 'corrupt',
      statusReason: 'lock path is not a directory',
    };
  }

  const metadataExists = fs.existsSync(metadataPath);
  const metadata = readMetadata(metadataPath);

  if (!metadataExists) {
    return {
      lockPath,
      metadata: null,
      metadataPath,
      state: isStaleLockDirectory(lockPath, staleAfterMs) ? 'stale' : 'corrupt',
      statusReason: 'metadata missing',
    };
  }

  if (metadata === null) {
    return {
      lockPath,
      metadata: null,
      metadataPath,
      state: isStaleLockDirectory(lockPath, staleAfterMs) ? 'stale' : 'corrupt',
      statusReason: 'metadata unreadable',
    };
  }

  return {
    lockPath,
    metadata,
    metadataPath,
    state: isStaleLock(metadata, staleAfterMs) ? 'stale' : 'active',
    statusReason: null,
  };
}

function isAlreadyExistsError(error: unknown): boolean {
  return error !== null && typeof error === 'object' && 'code' in error && error.code === 'EEXIST';
}
