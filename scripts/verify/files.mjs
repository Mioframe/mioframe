import fs from 'node:fs';
import path from 'node:path';
import {
  FORMAT_LINT_IGNORED_PREFIXES,
  IGNORED_PREFIXES,
  SOURCE_EXTENSIONS,
  VERIFY_LOG_DIR,
} from './config.mjs';

export function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

export function hasConfiguredPrefix(filePath, prefixes) {
  return prefixes.some((prefix) => filePath === prefix.slice(0, -1) || filePath.startsWith(prefix));
}

export function isIgnored(filePath) {
  return hasConfiguredPrefix(filePath, IGNORED_PREFIXES);
}

export function isFormatLintIgnored(filePath) {
  return hasConfiguredPrefix(filePath, FORMAT_LINT_IGNORED_PREFIXES);
}

export function uniqSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export function fileExists(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

export function directoryExists(directoryPath) {
  return fs.existsSync(directoryPath) && fs.statSync(directoryPath).isDirectory();
}

export function getLogPath(label) {
  return path.posix.join(VERIFY_LOG_DIR, `${label}.log`);
}

export function ensureLogsDirectory(labelsToReset = null) {
  if (!labelsToReset) {
    fs.rmSync(VERIFY_LOG_DIR, { recursive: true, force: true });
  }

  fs.mkdirSync(VERIFY_LOG_DIR, { recursive: true });

  for (const label of labelsToReset ?? []) {
    fs.rmSync(getLogPath(label), { force: true });
  }
}

export function getAllSiblingTestFiles(filePath) {
  if (!filePath.startsWith('src/')) {
    return [];
  }

  if (filePath.endsWith('.test.ts')) {
    return fileExists(filePath) ? [filePath] : [];
  }

  const extension = path.posix.extname(filePath);

  if (!SOURCE_EXTENSIONS.includes(extension)) {
    return [];
  }

  const baseName = path.posix.basename(filePath, extension);
  const dirPath = path.posix.dirname(filePath);
  const nameWithoutExt = filePath.slice(0, -extension.length);
  const exactMatch = `${nameWithoutExt}.test.ts`;

  if (fileExists(exactMatch)) {
    return [exactMatch];
  }

  const testCandidates = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.test.ts')) {
        continue;
      }

      const candidateBase = entry.name.slice(0, -'.test.ts'.length);
      const parts = candidateBase.split('.');

      if (parts.length >= 2 && parts[0] === baseName) {
        testCandidates.push(path.posix.join(dirPath, entry.name));
      }
    }
  } catch {
    // Directory read failure falls through to an empty focused test scope.
  }

  return uniqSorted(testCandidates);
}
