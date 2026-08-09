/**
 * Managed-release data-compatibility publication preflight.
 *
 * Enforces the managed pinned application updates feature's data
 * compatibility invariant (`docs/managed-pinned-updates.md`, "Data
 * compatibility") at publication time, as release/publication
 * infrastructure — not updater runtime behavior, and never inside
 * `publishManagedRelease()` itself:
 *
 *   While a previous managed release A remains a supported pin/rollback
 *   target, data written by newer release B must remain readable by A.
 *
 * Contract:
 * - no previous managed release for this channel -> `'not-applicable'`,
 *   real publication proceeds immediately;
 * - candidate `buildId` already equals the current retained latest ->
 *   `'idempotent'`, no new compatibility run, real publication proceeds
 *   immediately (and itself resolves the same zero-write no-op);
 * - a genuinely new candidate with an existing previous release -> stage the
 *   candidate into a temporary copy of the real published tree via the real
 *   `publishManagedRelease()`, run the real browser compatibility proof
 *   against that staged copy, and only report success when the proof
 *   passes. The real `workDir` (and therefore the real Pages repository) is
 *   never written to by this module.
 *
 * Malformed or unavailable previous-release metadata already fails closed
 * via `resolvePublicationPlan`'s own retained-tree validation, before any
 * staging is attempted.
 */

import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import { resolvePublicationPlan } from './retainedReleaseTree.mjs';
import { publishManagedRelease, resolveChannelBase } from './releasePublish.mjs';
import { runManagedReleaseDataCompatibilityProof } from '../../release/runManagedReleaseDataCompatibilityProof.mjs';

const defaultDeps = { runCompatibilityProof: runManagedReleaseDataCompatibilityProof };

/**
 * Copies `workDir` (the real cloned Pages work directory) into a fresh
 * temporary directory, excluding `.git` — the staged copy never needs, and
 * must never perform, any git operation.
 * @param workDir The real Pages work directory to copy.
 * @returns The staged copy's root directory. Caller owns removing it.
 */
function stagePublishedTreeCopy(workDir) {
  const stagedRoot = mkdtempSync(join(tmpdir(), 'managed-compat-staged-'));
  cpSync(workDir, stagedRoot, {
    recursive: true,
    filter: (src) => basename(src) !== '.git',
  });
  return stagedRoot;
}

/**
 * Runs the managed-release data-compatibility publication preflight for one
 * candidate build, before any real publication write. Must be called, and
 * must resolve or reject, before {@link publishManagedRelease} is called
 * against the real `workDir`.
 * @param options Preflight inputs — the same inputs the real publication
 * (`publishManagedRelease`) will be called with immediately afterward.
 * @param options.workDir The real, already-cloned Pages staging work directory root.
 * @param options.distDir Built `dist` directory for the candidate build.
 * @param options.channel Managed channel: `'stable'` or `'develop'`.
 * @param options.appVersion `package.json` version the candidate build was produced from.
 * @param options.buildId Exact source commit SHA the candidate build was produced from.
 * @param options.buildDate Canonical UTC ISO 8601 committer timestamp of `buildId`.
 * @param [deps] Test seam for the compatibility proof runner.
 * @returns The resolved preflight decision.
 * @throws {Error} When the retained tree is malformed or its content is not
 * physically restorable (via {@link resolvePublicationPlan}), when staging
 * the candidate into a temporary copy fails, or when the compatibility
 * proof fails or reports non-pass.
 */
export async function runManagedPublicationPreflight(
  { workDir, distDir, channel, appVersion, buildId, buildDate },
  deps = defaultDeps,
) {
  const channelBase = resolveChannelBase(workDir, channel);
  const updatesDir = join(channelBase, 'updates');
  const releasesDir = join(updatesDir, 'releases');

  // Read-only: validates the complete retained tree and resolves the
  // idempotent publication decision, exactly as the real publisher will,
  // without inspecting distDir or writing anything.
  const plan = resolvePublicationPlan(releasesDir, updatesDir, buildId, channelBase);

  if (plan.kind === 'no-op') {
    return { decision: 'idempotent', descriptor: plan.descriptor };
  }
  if (plan.nextReleaseNumber === 1) {
    return { decision: 'not-applicable' };
  }

  const previousReleaseNumber = plan.nextReleaseNumber - 1;
  const stagedWorkDir = stagePublishedTreeCopy(workDir);

  try {
    let stagedDescriptor;
    try {
      stagedDescriptor = publishManagedRelease({
        workDir: stagedWorkDir,
        distDir,
        channel,
        appVersion,
        buildId,
        buildDate,
      });
    } catch (error) {
      throw new Error(
        'Failed to stage the candidate managed release for the data-compatibility proof',
        { cause: error },
      );
    }

    const proof = await deps.runCompatibilityProof({
      stagedWorkDir,
      channel,
      previousReleaseNumber,
      candidateReleaseNumber: stagedDescriptor.releaseNumber,
    });
    if (!proof.passed) {
      throw new Error(
        `Managed release data-compatibility proof failed for channel "${channel}": ` +
          `release ${previousReleaseNumber} could not prove it can read data written by candidate release ${stagedDescriptor.releaseNumber}. Publication blocked.`,
      );
    }

    return { decision: 'proved', descriptor: stagedDescriptor, previousReleaseNumber };
  } finally {
    rmSync(stagedWorkDir, { recursive: true, force: true });
  }
}
