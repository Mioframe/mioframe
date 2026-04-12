import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import {
  analyzeProjectMemoryDiff,
  renderProjectMemoryDiffReview,
} from './reviewProjectMemoryDiff.mjs';
import { defaultTaskStatePath } from './startProjectMemoryTask.mjs';
import { repoRoot } from './projectMemoryUtils.mjs';

const usage = `Usage:
  pnpm memory:task:finish [--staged | --base <ref>] [--memory-resolution keep:<memory-path>] [--state-file <path>]

Examples:
  pnpm memory:task:finish
  pnpm memory:task:finish --memory-resolution keep:promoted/2026-04-12-vfs-directory-reread-after-create.md
  pnpm memory:task:finish --base origin/main`;

const parseArgs = (rawArgs) => {
  const args = rawArgs.slice(2);
  let staged = false;
  let base;
  let stateFilePath = defaultTaskStatePath;
  const memoryResolutions = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--staged') {
      staged = true;
      continue;
    }

    if (arg === '--base') {
      const value = args[index + 1];

      if (!value) {
        throw new Error('Expected a value after --base');
      }

      base = value;
      index += 1;
      continue;
    }

    if (arg === '--memory-resolution') {
      const value = args[index + 1];

      if (!value) {
        throw new Error('Expected a value after --memory-resolution');
      }

      memoryResolutions.push(value);
      index += 1;
      continue;
    }

    if (arg === '--state-file') {
      const value = args[index + 1];

      if (!value) {
        throw new Error('Expected a value after --state-file');
      }

      stateFilePath = path.isAbsolute(value) ? value : path.join(repoRoot, value);
      index += 1;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(usage);
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (staged && base) {
    throw new Error('Use either --staged or --base, not both.');
  }

  return {
    staged,
    base,
    stateFilePath,
    memoryResolutions,
  };
};

const runMemoryValidate = () => {
  const result = spawnSync('pnpm', ['memory:validate'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim(),
  };
};

try {
  const options = parseArgs(process.argv);
  const review = analyzeProjectMemoryDiff({
    ...options,
    requireTaskStart: true,
  });
  const validation = runMemoryValidate();

  console.log(renderProjectMemoryDiffReview(review));
  console.log('');
  console.log('Project memory validation');
  console.log('');
  console.log(validation.output || 'pnpm memory:validate completed with no output.');

  if (!validation.ok) {
    review.failures.push('`pnpm memory:validate` failed.');
  }

  if (review.failures.length > 0) {
    process.exit(1);
  }

  if (fs.existsSync(options.stateFilePath)) {
    fs.unlinkSync(options.stateFilePath);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error('');
  console.error(usage);
  process.exit(1);
}
