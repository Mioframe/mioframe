import fs from 'node:fs';
import path from 'node:path';

import { validateE2ETargetPath, type E2ETargetPathValidation } from './e2eOwner.ts';

/**
 * Filesystem-only structural invariant check: every `*.e2e.spec.ts` file
 * under `tests/e2e/` must be a structurally valid target E2E path. A target
 * E2E spec outside `tests/e2e/pages/<Owner>/` or `tests/e2e/widgets/<Owner>/`
 * is structural invalidity and fails E2E verification; it is not a harmless
 * full-lane fallback, since a misplaced spec would otherwise silently escape
 * affected-owner attribution. Independent of Playwright/dependency-cruiser
 * acquisition, so it is always cheap to run.
 */

const E2E_ROOT = 'tests/e2e';
const TARGET_SUFFIX = '.e2e.spec.ts';

/** Validation result for the current `tests/e2e/**\/*.e2e.spec.ts` tree shape. */
export interface E2ETargetTreeValidation {
  valid: boolean;
  errors: string[];
  /** Every discovered structurally valid target E2E path. */
  targetPaths: string[];
}

/** Test-only dependencies for {@link validateE2ETargetTree}. */
export interface ValidateE2ETargetTreeDeps {
  listFilesRecursively?: (root: string) => string[];
  validatePath?: (filePath: string) => E2ETargetPathValidation;
}

function defaultListFilesRecursively(root: string): string[] {
  const results: string[] = [];

  const walk = (dir: string): void => {
    let entries: fs.Dirent[];

    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.posix.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }
  };

  walk(root);

  return results;
}

/**
 * Validate that every `*.e2e.spec.ts` file currently under `tests/e2e/` is a
 * structurally valid target E2E path with an existing primary owner
 * directory. A file that merely ends in `.e2e.spec.ts` but lives outside
 * `tests/e2e/pages/<Owner>/` or `tests/e2e/widgets/<Owner>/` is structural
 * invalidity, not a path Playwright silently fails to discover.
 * @param [deps] Test-only dependencies.
 * @returns Validation result and every discovered valid target path.
 */
export function validateE2ETargetTree({
  listFilesRecursively = defaultListFilesRecursively,
  validatePath = validateE2ETargetPath,
}: ValidateE2ETargetTreeDeps = {}): E2ETargetTreeValidation {
  const targetShapedFiles = listFilesRecursively(E2E_ROOT).filter((filePath) =>
    filePath.endsWith(TARGET_SUFFIX),
  );
  const errors: string[] = [];
  const targetPaths: string[] = [];

  for (const filePath of targetShapedFiles) {
    const result = validatePath(filePath);

    if (!result.valid) {
      errors.push(...result.errors);
      continue;
    }

    targetPaths.push(filePath);
  }

  return { valid: errors.length === 0, errors, targetPaths };
}
