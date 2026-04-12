import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const projectMemoryRoot = path.join(repoRoot, '.project-memory');

export const directoryToStatus = Object.freeze({
  drafts: 'draft',
  verified: 'verified',
  promoted: 'promoted',
  archive: 'archived',
});

export const allowedKinds = new Set([
  'lesson',
  'library-semantics',
  'review-finding',
  'pattern',
  'pitfall',
]);

export const allowedStatuses = new Set(['draft', 'verified', 'promoted', 'archived']);
export const allowedConfidence = new Set(['low', 'medium', 'high']);
export const allowedArchiveReasons = new Set([
  'obsolete',
  'superseded',
  'merged',
  'contradicted',
  'redundant',
]);

const placeholderValues = new Set([
  'src/path/or/library',
  'Short, project-specific rule stated no stronger than the evidence supports.',
  'What breaks, regresses, or becomes misleading if the rule is ignored.',
  'Focused proof for the rule.',
  'Promote when the same lesson repeats or becomes enforceable.',
  'When this scope changes again.',
]);

const stripQuotes = (value) =>
  (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))
    ? value.slice(1, -1)
    : value;

const normalizeWhitespace = (value) => value.trim().replace(/\s+/g, ' ');

const countIndent = (line) => {
  const match = /^ */u.exec(line);

  return match ? match[0].length : 0;
};

const splitFrontmatter = (content, filePath) => {
  const normalizedContent = content.replace(/\r\n/g, '\n');

  if (!normalizedContent.startsWith('---\n')) {
    throw new Error(`${filePath}: missing opening frontmatter fence`);
  }

  const endFenceIndex = normalizedContent.indexOf('\n---\n', 4);

  if (endFenceIndex === -1) {
    throw new Error(`${filePath}: missing closing frontmatter fence`);
  }

  return {
    frontmatter: normalizedContent.slice(4, endFenceIndex),
    body: normalizedContent.slice(endFenceIndex + 5).trim(),
  };
};

const createFrontmatterParser = (frontmatter, filePath) => {
  const lines = frontmatter.split('\n');
  let lineIndex = 0;

  const fail = (message) => {
    throw new Error(`${filePath}: ${message}`);
  };

  const skipBlankLines = () => {
    while (lineIndex < lines.length && lines[lineIndex].trim() === '') {
      lineIndex += 1;
    }
  };

  const peek = () => {
    skipBlankLines();

    if (lineIndex >= lines.length) {
      return undefined;
    }

    return {
      line: lines[lineIndex],
      indent: countIndent(lines[lineIndex]),
    };
  };

  const parseScalar = (rawValue) => stripQuotes(rawValue.trim());

  const parseMap = (indent) => {
    const result = {};

    while (true) {
      const next = peek();

      if (!next || next.indent < indent) {
        return result;
      }

      if (next.indent > indent) {
        fail(`unexpected indentation on line ${lineIndex + 1}`);
      }

      const trimmed = next.line.slice(indent);

      if (trimmed.startsWith('- ')) {
        fail(`expected mapping key on line ${lineIndex + 1}`);
      }

      const separatorIndex = trimmed.indexOf(':');

      if (separatorIndex <= 0) {
        fail(`invalid mapping entry on line ${lineIndex + 1}`);
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1);
      lineIndex += 1;

      if (value.trim() !== '') {
        result[key] = parseScalar(value);
        continue;
      }

      const child = peek();

      if (!child || child.indent <= indent) {
        result[key] = '';
        continue;
      }

      if (child.indent !== indent + 2) {
        fail(`expected indentation of ${indent + 2} spaces after "${key}"`);
      }

      result[key] = parseNode(indent + 2);
    }
  };

  const parseInlineObject = (value, indent) => {
    const separatorIndex = value.indexOf(':');
    const key = value.slice(0, separatorIndex).trim();
    const rawInlineValue = value.slice(separatorIndex + 1).trim();
    const result = {
      [key]: parseScalar(rawInlineValue),
    };

    while (true) {
      const child = peek();

      if (!child || child.indent < indent) {
        return result;
      }

      if (child.indent > indent) {
        fail(`unexpected indentation on line ${lineIndex + 1}`);
      }

      const trimmed = child.line.slice(indent);

      if (trimmed.startsWith('- ')) {
        return result;
      }

      const separator = trimmed.indexOf(':');

      if (separator <= 0) {
        fail(`invalid inline mapping continuation on line ${lineIndex + 1}`);
      }

      const childKey = trimmed.slice(0, separator).trim();
      const childValue = trimmed.slice(separator + 1);
      lineIndex += 1;

      if (childValue.trim() === '') {
        fail(`nested blocks inside inline list objects are not supported (${childKey})`);
      }

      result[childKey] = parseScalar(childValue);
    }
  };

  const parseArray = (indent) => {
    const result = [];

    while (true) {
      const next = peek();

      if (!next || next.indent < indent) {
        return result;
      }

      if (next.indent > indent) {
        fail(`unexpected indentation on line ${lineIndex + 1}`);
      }

      const trimmed = next.line.slice(indent);

      if (!trimmed.startsWith('- ')) {
        return result;
      }

      const itemValue = trimmed.slice(2);
      lineIndex += 1;

      if (itemValue.trim() === '') {
        const child = peek();

        if (!child || child.indent <= indent) {
          result.push('');
          continue;
        }

        if (child.indent !== indent + 2) {
          fail(`expected indentation of ${indent + 2} spaces for array item`);
        }

        result.push(parseNode(indent + 2));
        continue;
      }

      if (/^[A-Za-z0-9_-]+:\s+\S/u.test(itemValue)) {
        result.push(parseInlineObject(itemValue, indent + 2));
        continue;
      }

      result.push(parseScalar(itemValue));
    }
  };

  const parseNode = (indent) => {
    const next = peek();

    if (!next) {
      return undefined;
    }

    if (next.indent !== indent) {
      fail(`unexpected indentation on line ${lineIndex + 1}`);
    }

    return next.line.slice(indent).startsWith('- ') ? parseArray(indent) : parseMap(indent);
  };

  const parsed = parseMap(0);

  if (peek()) {
    fail(`could not parse frontmatter near line ${lineIndex + 1}`);
  }

  return parsed;
};

export const parseEntryFile = (absolutePath) => {
  const rawContent = fs.readFileSync(absolutePath, 'utf8');
  const relativePath = path.relative(repoRoot, absolutePath);
  const { frontmatter, body } = splitFrontmatter(rawContent, relativePath);
  const data = createFrontmatterParser(frontmatter, relativePath);
  const directory = relativePath.split(path.sep)[1];

  return {
    absolutePath,
    relativePath,
    memoryRelativePath: path.relative(projectMemoryRoot, absolutePath),
    directory,
    data,
    body,
    content: rawContent,
  };
};

export const getEntryFiles = () =>
  Object.keys(directoryToStatus)
    .flatMap((directory) => {
      const directoryPath = path.join(projectMemoryRoot, directory);

      if (!fs.existsSync(directoryPath)) {
        return [];
      }

      return fs
        .readdirSync(directoryPath)
        .filter((entry) => entry.endsWith('.md'))
        .map((entry) => path.join(directoryPath, entry));
    })
    .sort((left, right) => left.localeCompare(right));

export const loadEntries = () => getEntryFiles().map(parseEntryFile);

export const asNonEmptyString = (value) =>
  typeof value === 'string' && normalizeWhitespace(value) !== ''
    ? normalizeWhitespace(value)
    : undefined;

export const isMeaninglessString = (value) => {
  const normalized = normalizeWhitespace(value);

  return (
    normalized === '' ||
    placeholderValues.has(normalized) ||
    /^(todo|tbd|n\/a|unknown|fill in)$/iu.test(normalized)
  );
};

export const looksLikeIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/u.test(value);

export const isValidIsoDate = (value) => {
  if (!looksLikeIsoDate(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
};

export const stripLocalPathSuffix = (ref) =>
  ref.replace(/#L\d+(?:-L\d+)?$/u, '').replace(/:(\d+)(?::\d+)?$/u, '');

const looksLikeRepoPath = (ref) => {
  if (/^[a-z]+:\/\//iu.test(ref)) {
    return false;
  }

  const candidate = stripLocalPathSuffix(ref.trim()).replace(/^\.\/+/u, '');

  if (candidate === '' || candidate.startsWith('/')) {
    return false;
  }

  if (candidate.includes(' ')) {
    return false;
  }

  if (candidate.includes('/')) {
    return true;
  }

  return /^(AGENTS\.md|package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|env\.d\.ts|tsconfig.*\.json|vite\.config\..+|cypress\.config\..+|eslint\.config\..+|.*\.(md|ts|tsx|js|jsx|mjs|mts|cjs|json|yaml|yml|vue|css|scss|html))$/u.test(
    candidate,
  );
};

export const resolveRepoPath = (ref) => {
  const candidate = stripLocalPathSuffix(ref.trim()).replace(/^\.\/+/u, '');

  if (candidate === '') {
    return undefined;
  }

  const absoluteCandidate = path.join(repoRoot, candidate);

  if (fs.existsSync(absoluteCandidate)) {
    return absoluteCandidate;
  }

  return undefined;
};

export const isLocalRepoRef = (ref) => {
  return looksLikeRepoPath(ref);
};

export const normalizeScopeEntry = (value) => normalizeWhitespace(value).toLowerCase();

export const normalizedScopeSignature = (scope) =>
  [...new Set(scope.map(normalizeScopeEntry))]
    .sort((left, right) => left.localeCompare(right))
    .join('|');

export const tokenizeRule = (value) =>
  [...new Set(value.toLowerCase().match(/[a-z0-9@._-]+/gu) ?? [])].filter(
    (token) => token.length > 2,
  );

export const calculateTokenJaccard = (left, right) => {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const union = new Set([...leftSet, ...rightSet]);
  let intersectionSize = 0;

  leftSet.forEach((token) => {
    if (rightSet.has(token)) {
      intersectionSize += 1;
    }
  });

  return union.size === 0 ? 0 : intersectionSize / union.size;
};

export const formatAgeInDays = (isoDate) => {
  const verifiedAt = new Date(`${isoDate}T00:00:00Z`);

  if (Number.isNaN(verifiedAt.valueOf())) {
    return undefined;
  }

  return Math.floor((Date.now() - verifiedAt.valueOf()) / (24 * 60 * 60 * 1000));
};
