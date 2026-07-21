import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function resolveOnlyLabel(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--only') {
      return argv[index + 1] ?? null;
    }

    if (argument.startsWith('--only=')) {
      return argument.slice('--only='.length) || null;
    }
  }

  return null;
}

export function shouldRunMaterialTokenGuard(argv) {
  if (argv.includes('--full')) {
    return false;
  }

  const onlyLabel = resolveOnlyLabel(argv);
  return onlyLabel === null || onlyLabel === 'unit-tests';
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

export function runVerifyEntry(argv = process.argv.slice(2)) {
  if (shouldRunMaterialTokenGuard(argv)) {
    const guardStatus = run('pnpm', [
      'exec',
      'vitest',
      'run',
      '--reporter=verbose',
      'scripts/materialTokenArchitecture.test.mjs',
    ]);

    if (guardStatus !== 0) {
      return guardStatus;
    }
  }

  return run('node', ['scripts/verify.mjs', ...argv]);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = runVerifyEntry();
}
