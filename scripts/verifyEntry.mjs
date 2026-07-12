import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * Select whether canonical instruction policy should check or fix.
 * @param {string[]} args Verify CLI arguments.
 * @returns {'--check' | '--fix'} Policy mode.
 */
export function resolveInstructionPolicyMode(args) {
  return args.includes('--fix') || args.includes('--fix-only') ? '--fix' : '--check';
}

/**
 * Run a repository Node script with inherited stdio.
 * @param {string} scriptPath Repository-relative script path.
 * @param {string[]} args Script arguments.
 * @returns {number} Process exit code.
 */
function runScript(scriptPath, args) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

function main() {
  const args = process.argv.slice(2);
  const policyStatus = runScript(
    'scripts/agentInstructionPolicy.mjs',
    [resolveInstructionPolicyMode(args)],
  );

  if (policyStatus !== 0) {
    process.exit(policyStatus);
  }

  process.exit(runScript('scripts/verify.mjs', args));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
