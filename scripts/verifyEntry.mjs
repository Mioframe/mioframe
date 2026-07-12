import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptsDirectory, '..');

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
 * @param {string} fileName Script file name under scripts/.
 * @param {string[]} args Script arguments.
 * @returns {number} Process exit code.
 */
function runScript(fileName, args) {
  const result = spawnSync(process.execPath, [path.join(scriptsDirectory, fileName), ...args], {
    cwd: repositoryRoot,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

function main() {
  const args = process.argv.slice(2);
  const policyStatus = runScript('agentInstructionPolicy.mjs', [
    resolveInstructionPolicyMode(args),
  ]);

  if (policyStatus !== 0) {
    process.exit(policyStatus);
  }

  process.exit(runScript('verify.mjs', args));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
