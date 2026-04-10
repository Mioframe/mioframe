import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectoryPath = dirname(fileURLToPath(import.meta.url));
const repositoryRootPath = resolve(scriptDirectoryPath, '..');
const gitDirectoryPath = resolve(repositoryRootPath, '.git');

if (!existsSync(gitDirectoryPath)) {
  process.exit(0);
}

const currentHooksPath = spawnSync('git', ['config', '--get', 'core.hooksPath'], {
  cwd: repositoryRootPath,
  encoding: 'utf8',
});

const configuredHooksPath = currentHooksPath.stdout.trim();

if (currentHooksPath.status === 0 && configuredHooksPath && configuredHooksPath !== '.githooks') {
  console.warn(
    `Skipping git hook installation because core.hooksPath is already set to "${configuredHooksPath}".`,
  );
  process.exit(0);
}

const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
  cwd: repositoryRootPath,
  stdio: 'inherit',
});

if (result.status !== 0) {
  console.warn('Skipping git hook installation.');
}
