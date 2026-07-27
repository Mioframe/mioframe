import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = process.cwd();
const selfPath = fileURLToPath(import.meta.url);

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function write(relativePath, content) {
  fs.writeFileSync(path.join(rootDir, relativePath), content, 'utf8');
}

function replaceExact(relativePath, before, after) {
  const content = read(relativePath);
  const occurrences = content.split(before).length - 1;

  if (occurrences !== 1) {
    throw new Error(`${relativePath}: expected exactly one replacement, found ${occurrences}`);
  }

  write(relativePath, content.replace(before, after));
}

const runCliDoc = `/**
 * Run the verify CLI when the module is executed directly.`;
const metadataHelper = `/**
 * Build the persisted metadata for the top-level verify lock.
 * @param argv Effective verify CLI arguments.
 * @returns Lock metadata with a shell-safe, scope-complete display command.
 */
export function getVerifyLockMetadata(argv) {
  return {
    command: formatCommand('pnpm', ['verify', ...argv]),
    label: 'verify',
    logPath: VERIFY_LOG_DIR,
  };
}

${runCliDoc}`;
replaceExact('scripts/verify.mjs', runCliDoc, metadataHelper);

replaceExact(
  'scripts/verify.mjs',
  `  await withVerifyLock(
    {
      command: formatCommand('pnpm', ['verify', ...cliArgs]),
      label: 'verify',
      logPath: VERIFY_LOG_DIR,
    },
    (verifyLockEnv, verifyLockController) => runMain(verifyLockEnv, verifyLockController),
  );`,
  `  await withVerifyLock(
    getVerifyLockMetadata(cliArgs),
    (verifyLockEnv, verifyLockController) => runMain(verifyLockEnv, verifyLockController),
  );`,
);

replaceExact(
  'scripts/verifyResume.test.mjs',
  `import { getEffectiveVerifyArgs, getVerifyRerunCommand } from './verify.mjs';`,
  `import { getEffectiveVerifyArgs, getVerifyLockMetadata } from './verify.mjs';`,
);

replaceExact(
  'scripts/verifyResume.test.mjs',
  `    const command = getVerifyRerunCommand(effectiveArgs);

    expect(getRetryInstruction({ command })).toBe(`,
  `    const metadata = getVerifyLockMetadata(effectiveArgs);

    expect(getRetryInstruction(metadata)).toBe(`,
);

const packagePath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.scripts['ci:autofix'] = 'node scripts/verify.mjs --fix-only';
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
fs.rmSync(selfPath);
