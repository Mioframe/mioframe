import fs from 'node:fs';
import path from 'node:path';

// Deterministic import/export extraction and alias resolution for the
// Material static architecture validator. This is intentionally not a
// JavaScript/TypeScript parser: it strips comments and string-literal noise
// well enough to find import specifiers reliably in this repository's
// authoring conventions, then resolves them against the project's known
// path aliases and the real filesystem.

/**
 * Project path aliases, ordered as declared in tsconfig.src.json /
 * config/alias.ts. Longer/more specific prefixes are listed before the
 * catch-all `@/` prefix; since none of these prefixes overlap textually,
 * a single pass is sufficient.
 */
export const PROJECT_ALIASES = [
  { prefix: '@shared/', target: 'src/shared/' },
  { prefix: '@feature/', target: 'src/features/' },
  { prefix: '@entity/', target: 'src/entities/' },
  { prefix: '@widget/', target: 'src/widgets/' },
  { prefix: '@page/', target: 'src/pages/' },
  { prefix: '@/', target: 'src/' },
];

const RESOLVE_EXTENSIONS = ['.ts', '.vue', '.mjs', '.js', '.css'];
const INDEX_BASENAMES = ['index.ts', 'index.mjs', 'index.js'];

/**
 * Normalize an OS-specific path to POSIX form.
 * @param filePath Path using the current platform's separators.
 * @returns The same path using `/` separators.
 */
export function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

/**
 * Blank out line/block comments while preserving string and template
 * literal contents (import specifiers live inside quotes and must survive).
 * Replaced comment characters are turned into spaces (newlines kept) so
 * reported line numbers, when ever needed, remain stable.
 * @param source Raw file source, or an already-extracted `<script>` body.
 * @returns Source text with comments blanked out.
 */
export function stripComments(source) {
  let result = '';
  let index = 0;
  const length = source.length;
  let inLineComment = false;
  let inBlockComment = false;
  let stringDelimiter = null;

  while (index < length) {
    const char = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
        result += '\n';
      } else {
        result += ' ';
      }
      index += 1;
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        result += '  ';
        index += 2;
        inBlockComment = false;
        continue;
      }
      result += char === '\n' ? '\n' : ' ';
      index += 1;
      continue;
    }

    if (stringDelimiter !== null) {
      result += char;
      if (char === '\\') {
        result += next ?? '';
        index += 2;
        continue;
      }
      if (char === stringDelimiter) {
        stringDelimiter = null;
      }
      index += 1;
      continue;
    }

    if (char === '/' && next === '/') {
      inLineComment = true;
      result += '  ';
      index += 2;
      continue;
    }

    if (char === '/' && next === '*') {
      inBlockComment = true;
      result += '  ';
      index += 2;
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      stringDelimiter = char;
      result += char;
      index += 1;
      continue;
    }

    result += char;
    index += 1;
  }

  return result;
}

/**
 * Extract the concatenated `<script>` body/bodies of a Vue single-file
 * component, or the raw source unchanged for non-`.vue` files.
 * @param filePath Repository-relative path of the file, used to decide
 * whether Vue script extraction applies.
 * @param rawContent Full raw file content.
 * @returns Source text to scan for imports.
 */
export function extractScriptSource(filePath, rawContent) {
  if (!filePath.endsWith('.vue')) {
    return rawContent;
  }

  const blocks = [...rawContent.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(
    (match) => match[1],
  );

  return blocks.join('\n');
}

// Lazy scans are bounded to characters that cannot appear in an import
// clause / export clause (quotes, parens, semicolons), so they cannot run
// away past the intended statement even without a real parser.
const IMPORT_FROM_PATTERN = /\bimport\b(?!\s*\()[^'"();]*?\bfrom\s*(['"])((?:(?!\1)[^\\]|\\.)*)\1/g;
const IMPORT_BARE_PATTERN = /\bimport\s*(['"])((?:(?!\1)[^\\]|\\.)*)\1/g;
const EXPORT_FROM_PATTERN = /\bexport\b[^'"();]*?\bfrom\s*(['"])((?:(?!\1)[^\\]|\\.)*)\1/g;
const DYNAMIC_IMPORT_PATTERN = /\bimport\s*\(\s*(['"])((?:(?!\1)[^\\]|\\.)*)\1\s*\)/g;
const REQUIRE_PATTERN = /\brequire\s*\(\s*(['"])((?:(?!\1)[^\\]|\\.)*)\1\s*\)/g;

/**
 * Extract every static import/re-export/dynamic-import specifier referenced
 * by a source file. Comments are ignored; only string-literal targets are
 * considered, matching the "static import()" requirement.
 * @param rawSource Raw file content (or an already-extracted script body).
 * @returns Sorted, de-duplicated list of specifier strings.
 */
export function extractImportSpecifiers(rawSource) {
  const cleaned = stripComments(rawSource);
  const specifiers = new Set();

  for (const pattern of [
    IMPORT_FROM_PATTERN,
    IMPORT_BARE_PATTERN,
    EXPORT_FROM_PATTERN,
    DYNAMIC_IMPORT_PATTERN,
    REQUIRE_PATTERN,
  ]) {
    for (const match of cleaned.matchAll(pattern)) {
      specifiers.add(match[2]);
    }
  }

  return [...specifiers].sort((left, right) => left.localeCompare(right));
}

/**
 * Resolve an import specifier written from a given file to a
 * repository-relative POSIX path, using project aliases and relative-path
 * semantics. External package specifiers (no alias/relative prefix match)
 * are reported as `external`.
 * @param specifier Raw import specifier string.
 * @param fromFilePath Repository-relative POSIX path of the importing file.
 * @returns Resolution result: `{ kind: 'external', specifier }` or
 * `{ kind: 'internal', rawPath }`, where `rawPath` is not yet checked
 * against the filesystem.
 */
export function classifySpecifier(specifier, fromFilePath) {
  if (specifier.startsWith('.')) {
    const fromDir = path.posix.dirname(fromFilePath);
    return { kind: 'internal', rawPath: path.posix.normalize(path.posix.join(fromDir, specifier)) };
  }

  for (const alias of PROJECT_ALIASES) {
    if (specifier.startsWith(alias.prefix)) {
      return {
        kind: 'internal',
        rawPath: path.posix.normalize(alias.target + specifier.slice(alias.prefix.length)),
      };
    }
  }

  return { kind: 'external', specifier };
}

/**
 * Resolve a raw internal path candidate to an actual repository file, trying
 * the exact path, known extensions, and `index.*` resolution for
 * directory-like targets.
 * @param rawPath Repository-relative POSIX path candidate (no extension
 * guaranteed).
 * @param [options] Resolution inputs.
 * @param [options.repoRoot] Absolute filesystem repository root.
 * @param [options.fsApi] Injectable `fs` module, for tests.
 * @returns `{ path, exists }`; `path` is the best-effort resolved path even
 * when `exists` is `false`.
 */
export function resolveInternalPath(rawPath, { repoRoot = process.cwd(), fsApi = fs } = {}) {
  const absoluteCandidate = path.join(repoRoot, rawPath);

  if (fsApi.existsSync(absoluteCandidate) && fsApi.statSync(absoluteCandidate).isFile()) {
    return { path: rawPath, exists: true };
  }

  for (const extension of RESOLVE_EXTENSIONS) {
    const candidate = `${rawPath}${extension}`;

    if (fsApi.existsSync(path.join(repoRoot, candidate))) {
      return { path: candidate, exists: true };
    }
  }

  if (fsApi.existsSync(absoluteCandidate) && fsApi.statSync(absoluteCandidate).isDirectory()) {
    for (const indexName of INDEX_BASENAMES) {
      const candidate = path.posix.join(rawPath, indexName);

      if (fsApi.existsSync(path.join(repoRoot, candidate))) {
        return { path: candidate, exists: true };
      }
    }
  }

  return { path: rawPath, exists: false };
}

/**
 * Resolve every import specifier of a file to repository-relative internal
 * targets, dropping external package specifiers.
 * @param filePath Repository-relative POSIX path of the importing file.
 * @param rawContent Full raw file content.
 * @param [options] Resolution inputs; see {@link resolveInternalPath}.
 * @returns Sorted list of `{ specifier, path, exists }` internal import
 * targets.
 */
export function resolveFileImports(filePath, rawContent, options = {}) {
  const scriptSource = extractScriptSource(filePath, rawContent);
  const specifiers = extractImportSpecifiers(scriptSource);
  const resolved = [];

  for (const specifier of specifiers) {
    const classified = classifySpecifier(specifier, filePath);

    if (classified.kind === 'external') {
      continue;
    }

    const { path: resolvedPath, exists } = resolveInternalPath(classified.rawPath, options);
    resolved.push({ specifier, path: resolvedPath, exists });
  }

  return resolved.sort((left, right) => left.specifier.localeCompare(right.specifier));
}
