import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const projectMemoryRoot = path.join(repoRoot, '.project-memory');
export const projectMemoryTaskStateRoot = path.join(projectMemoryRoot, '.task-state');
export const currentTaskStatePath = path.join(projectMemoryTaskStateRoot, 'current-task.json');
export const lastTaskFinishPath = path.join(projectMemoryTaskStateRoot, 'last-finish.json');

export const directoryToStatus = Object.freeze({
  drafts: 'draft',
  verified: 'verified',
  promoted: 'promoted',
  archive: 'archived',
});

const projectMemoryEntryDirectories = new Set(Object.keys(directoryToStatus));

export const allowedKinds = new Set([
  'lesson',
  'correction',
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

export const isProjectMemoryEntryPath = (filePath) => {
  const normalizedPath = normalizeRepoRelativePath(filePath);

  if (!normalizedPath.startsWith('.project-memory/')) {
    return false;
  }

  const segments = normalizedPath.split('/');

  return (
    segments.length === 3 &&
    projectMemoryEntryDirectories.has(segments[1]) &&
    segments[2].endsWith('.md')
  );
};

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

export const toPosixPath = (value) => value.replaceAll(path.sep, '/');

export const normalizeRepoRelativePath = (value) => {
  const trimmed = normalizeWhitespace(value).replace(/^\.\/+/u, '');

  if (trimmed === '') {
    return '';
  }

  return toPosixPath(trimmed).replace(/\/+/gu, '/').replace(/\/$/u, '');
};

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
  const candidate = normalizeRepoRelativePath(stripLocalPathSuffix(ref.trim()));

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

export const normalizeScopeEntry = (value) => normalizeRepoRelativePath(value).toLowerCase();

export const getParentScope = (value) => {
  const normalized = normalizeRepoRelativePath(value);

  if (normalized === '' || !normalized.includes('/')) {
    return undefined;
  }

  const parent = path.posix.dirname(normalized);

  return parent === '.' ? undefined : parent;
};

export const scopeContainsPath = (scope, repoRelativePath) => {
  const normalizedScope = normalizeScopeEntry(scope);
  const normalizedPath = normalizeScopeEntry(repoRelativePath);

  return (
    normalizedScope === normalizedPath ||
    normalizedPath.startsWith(`${normalizedScope}/`) ||
    normalizedScope.startsWith(`${normalizedPath}/`)
  );
};

export const normalizedScopeSignature = (scope) =>
  [...new Set(scope.map(normalizeScopeEntry))]
    .sort((left, right) => left.localeCompare(right))
    .join('|');

export const riskyMatchers = [
  {
    category: 'memory system',
    match: (filePath) =>
      filePath.startsWith('.project-memory/') ||
      filePath.startsWith('scripts/project-memory/') ||
      filePath === 'AGENTS.md' ||
      filePath.startsWith('.codex/'),
  },
  {
    category: 'shared infrastructure',
    match: (filePath) => filePath.startsWith('src/shared/'),
  },
  {
    category: 'service boundaries',
    match: (filePath) => filePath.startsWith('src/shared/service/'),
  },
  {
    category: 'CRDT',
    match: (filePath) =>
      /(^|\/)(automerge|crdt)(\/|$)/iu.test(filePath) ||
      filePath.startsWith('src/shared/lib/changeObject') ||
      filePath.startsWith('src/shared/service/databaseDocument'),
  },
  {
    category: 'VFS/filesystem',
    match: (filePath) =>
      /filesystem|virtualfilesystem/iu.test(filePath) ||
      filePath.startsWith('src/shared/lib/googleDrive'),
  },
  {
    category: 'schema/migration',
    match: (filePath) =>
      /schema|migration|zod/iu.test(filePath) || filePath.startsWith('src/shared/lib/migrations'),
  },
  {
    category: 'helper semantics',
    match: (filePath) => filePath.startsWith('src/shared/lib/'),
  },
];

export const strongerArtifactMatchers = [
  {
    kind: 'AGENTS.md',
    match: (filePath) => filePath === 'AGENTS.md' || filePath.endsWith('/AGENTS.md'),
  },
  {
    kind: 'test',
    match: (filePath) => /\.(test|spec)\.[a-z]+$/iu.test(filePath),
  },
  {
    kind: 'guard',
    match: (filePath) => /typeguards|guard/iu.test(filePath),
  },
  {
    kind: 'migration',
    match: (filePath) => /migration/iu.test(filePath),
  },
  {
    kind: 'schema',
    match: (filePath) => /schema|zod/iu.test(filePath),
  },
  {
    kind: 'adapter',
    match: (filePath) => /adapter/iu.test(filePath),
  },
];

export const classifyRiskyCategories = (filePath) =>
  riskyMatchers.flatMap((matcher) => (matcher.match(filePath) ? [matcher.category] : []));

export const isRiskyPath = (filePath) => classifyRiskyCategories(filePath).length > 0;

export const classifyStrongerArtifacts = (filePath) =>
  strongerArtifactMatchers.flatMap((matcher) => (matcher.match(filePath) ? [matcher.kind] : []));

export const correctionLikeKinds = new Set(['correction', 'review-finding', 'pitfall']);

export const entrySearchTextFields = (entry) =>
  [
    entry.relativePath,
    entry.data.rule,
    entry.data.why,
    entry.data.mistake,
    entry.data.correction,
    ...(entry.data['applies-when'] ?? []),
    entry.body,
    ...(entry.data.scope ?? []),
    ...(entry.data['review-trigger'] ?? []),
    ...(Array.isArray(entry.data.evidence)
      ? entry.data.evidence.flatMap((evidence) => [evidence.type, evidence.ref, evidence.note])
      : []),
  ].filter(Boolean);

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

export const getTodayIsoDate = () => new Date().toISOString().slice(0, 10);

const uniqueValues = (values) => [...new Set(values.filter(Boolean))];

export const getBoundaryScopes = (entries, scopes) => {
  const normalizedScopes = uniqueValues(scopes.map(normalizeRepoRelativePath));

  if (normalizedScopes.length === 0) {
    return [];
  }

  return uniqueValues(
    entries
      .filter((entry) => entry.data.status !== 'archived')
      .flatMap((entry) => {
        const entryScopes = Array.isArray(entry.data.scope)
          ? entry.data.scope.map(normalizeRepoRelativePath)
          : [];

        if (
          !entryScopes.some((entryScope) =>
            normalizedScopes.some((scope) => scopeContainsPath(scope, entryScope)),
          )
        ) {
          return [];
        }

        return entryScopes.filter(
          (entryScope) =>
            !normalizedScopes.some((scope) => scopeContainsPath(scope, entryScope)) &&
            isRiskyPath(entryScope),
        );
      }),
  );
};

export const buildProjectMemoryLookup = ({
  entries = loadEntries(),
  scopeQueries = [],
  termQueries = [],
  includeArchived = false,
  includeBoundaryScopes = true,
} = {}) => {
  const normalizedScopes = uniqueValues(scopeQueries.map(normalizeRepoRelativePath));
  const normalizedTerms = uniqueValues(termQueries.map((term) => asNonEmptyString(term)));
  const parentScopeQueries = uniqueValues(normalizedScopes.map(getParentScope));
  const boundaryScopeQueries = includeBoundaryScopes
    ? getBoundaryScopes(entries, [...normalizedScopes, ...parentScopeQueries])
    : [];
  const lookupScopes = uniqueValues([
    ...normalizedScopes,
    ...parentScopeQueries,
    ...boundaryScopeQueries,
  ]);
  const rankedEntries = rankEntries(entries, {
    scopeQueries: lookupScopes,
    termQueries: normalizedTerms,
    includeArchived,
  });

  return {
    scopeQueries: normalizedScopes,
    parentScopeQueries,
    boundaryScopeQueries,
    lookupScopes,
    termQueries: normalizedTerms,
    includeArchived,
    rankedEntries,
  };
};

const isLegacyActiveTaskState = (state) =>
  state &&
  typeof state === 'object' &&
  state.status === undefined &&
  !state.finish?.completedAt &&
  Array.isArray(state.exactScopes);

export const isActiveTaskState = (state) =>
  Boolean(
    state &&
    typeof state === 'object' &&
    ((state.status === 'active' && Array.isArray(state.exactScopes)) ||
      isLegacyActiveTaskState(state)),
  );

export const readActiveTaskState = (stateFilePath = currentTaskStatePath) => {
  if (!fs.existsSync(stateFilePath)) {
    return undefined;
  }

  const parsed = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));

  return isActiveTaskState(parsed) ? parsed : undefined;
};

export const rankEntries = (
  entries,
  { scopeQueries = [], termQueries = [], includeArchived = false },
) => {
  const normalizedScopes = scopeQueries.map((scope) => normalizeScopeEntry(scope)).filter(Boolean);
  const normalizedTerms = termQueries
    .map((term) => asNonEmptyString(term))
    .filter(Boolean)
    .map((term) => term.toLowerCase());
  const normalizedTermTokens = [...new Set(normalizedTerms.flatMap((term) => tokenizeRule(term)))];
  const candidates = entries.filter((entry) => includeArchived || entry.data.status !== 'archived');

  return candidates
    .map((entry) => {
      let score = 0;
      const reasons = [];
      const entryScopes = Array.isArray(entry.data.scope)
        ? entry.data.scope.map((scope) => normalizeScopeEntry(scope))
        : [];
      const searchableFields = entrySearchTextFields(entry);
      const searchableText = searchableFields.join('\n').toLowerCase();
      const searchTokens = new Set(searchableFields.flatMap((field) => tokenizeRule(`${field}`)));

      normalizedScopes.forEach((query) => {
        entryScopes.forEach((entryScope) => {
          if (entryScope === query) {
            score += 12;
            reasons.push(`scope=${entryScope}`);
          } else if (entryScope.startsWith(`${query}/`) || query.startsWith(`${entryScope}/`)) {
            score += 8;
            reasons.push(`scope-overlap=${entryScope}`);
          }
        });
      });

      normalizedTerms.forEach((term) => {
        if (searchableText.includes(term)) {
          score += 3;
          reasons.push(`term=${term}`);
        } else if (searchTokens.has(term)) {
          score += 2;
          reasons.push(`token=${term}`);
        }
      });

      if (normalizedTermTokens.length > 0) {
        const similarity = calculateTokenJaccard(normalizedTermTokens, [...searchTokens]);

        if (similarity >= 0.2) {
          score += Math.max(1, Math.round(similarity * 10));
          reasons.push(`term-similarity=${similarity.toFixed(2)}`);
        }
      }

      if (correctionLikeKinds.has(entry.data.kind) && score > 0) {
        score += 2;
        reasons.push(`kind=${entry.data.kind}`);
      }

      return {
        entry,
        score,
        reasons,
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.entry.relativePath.localeCompare(right.entry.relativePath);
    });
};
