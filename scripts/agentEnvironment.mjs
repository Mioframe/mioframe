/**
 * Agent environment compatibility check/fix script.
 *
 * Ensures Claude Code can load project rules and skills that are canonically
 * defined in AGENTS.md files and .agents/skills. Also enforces fail-closed
 * UTC timestamp validity for canonical Material workflow stage artifacts
 * (DESIGN.md, ARCHITECTURE.md, IMPLEMENTATION.md, MIGRATION.md, REVIEW.md).
 *
 * Usage:
 *   node scripts/agentEnvironment.mjs --check
 *   node scripts/agentEnvironment.mjs --fix
 *   node scripts/agentEnvironment.mjs --check-material-artifact <artifact-path>
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MANAGED_MARKER = '<!-- managed:agent-compat -->';

const MATERIAL_COMPONENTS_ROOT = path.posix.join('src', 'shared', 'ui', 'material', 'components');
const MATERIAL_ARTIFACT_STAGES = [
  'DESIGN',
  'ARCHITECTURE',
  'IMPLEMENTATION',
  'MIGRATION',
  'REVIEW',
];
const MATERIAL_ARTIFACT_PATH_PATTERN = new RegExp(
  `^${MATERIAL_COMPONENTS_ROOT}/([^/]+)/(${MATERIAL_ARTIFACT_STAGES.join('|')})\\.md$`,
);
const UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const UTC_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REQUIRED_PROJECT_SKILL_FRONTMATTER_KEYS = new Set(['name', 'description']);
const SUPPORTED_SKILL_FRONTMATTER_KEYS = new Set([
  'name',
  'description',
  'when_to_use',
  'argument-hint',
  'arguments',
  'disable-model-invocation',
  'user-invocable',
  'allowed-tools',
  'model',
  'effort',
  'context',
  'agent',
  'hooks',
  'paths',
  'shell',
]);

const ROOT_CLAUDE_MD = `<!-- managed:agent-compat -->

@AGENTS.md

## Claude Code compatibility

This repository uses AGENTS.md as the canonical agent instruction format.

Do not duplicate project policy in CLAUDE.md. Update AGENTS.md, nested AGENTS.md, or canonical skill files under .agents/skills instead.
`;

const NESTED_CLAUDE_MD = `<!-- managed:agent-compat -->

@AGENTS.md
`;

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'dist-ssr',
  'coverage',
  'playwright-report',
  'test-results',
  '.git',
  '.verify',
  '.stryker-tmp',
  'reports',
  'storybook-static',
  'temp',
  'tmp',
  '.sisyphus',
  '.opencode',
  '.claude',
]);

/**
 * Find matching files below a root while excluding generated and local state.
 * @param root Absolute search root.
 * @param fileName File name to match.
 * @returns Relative POSIX paths.
 */
function findNamedFiles(root, fileName) {
  const results = [];

  function visit(directory) {
    let entries;

    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          visit(entryPath);
        }
        continue;
      }

      if (entry.isFile() && entry.name === fileName) {
        results.push(path.relative(root, entryPath).split(path.sep).join('/'));
      }
    }
  }

  visit(root);
  return results.sort((left, right) => left.localeCompare(right));
}

/**
 * Validate canonical Claude Code skill frontmatter.
 * @param root Repository root.
 * @returns Frontmatter validation result.
 */
export function checkSkillFrontmatter(root) {
  const skillsRoot = path.join(root, '.agents', 'skills');
  const errors = [];

  if (!fs.existsSync(skillsRoot)) {
    return { errors, fixes: [] };
  }

  for (const skillRelPath of findNamedFiles(skillsRoot, 'SKILL.md')) {
    const displayPath = path.posix.join('.agents/skills', skillRelPath);
    const content = fs.readFileSync(path.join(skillsRoot, skillRelPath), 'utf8');
    const lines = content.split(/\r?\n/);

    if (lines[0] !== '---') {
      errors.push(`${displayPath} must start with YAML frontmatter delimited by ---.`);
      continue;
    }

    const closingIndex = lines.indexOf('---', 1);

    if (closingIndex === -1) {
      errors.push(`${displayPath} has no closing --- for YAML frontmatter.`);
      continue;
    }

    const keys = [];

    for (const line of lines.slice(1, closingIndex)) {
      const match = /^([a-zA-Z0-9_-]+):(?:\s|$)/.exec(line);

      if (match) {
        keys.push(match[1]);
      }
    }

    for (const requiredKey of REQUIRED_PROJECT_SKILL_FRONTMATTER_KEYS) {
      if (!keys.includes(requiredKey)) {
        errors.push(`${displayPath} is missing required project frontmatter key '${requiredKey}'.`);
      }
    }

    const unsupportedKeys = [...new Set(keys)].filter(
      (key) => !SUPPORTED_SKILL_FRONTMATTER_KEYS.has(key),
    );

    if (unsupportedKeys.length > 0) {
      errors.push(
        `${displayPath} uses undocumented Claude Code skill frontmatter keys: ${unsupportedKeys.join(', ')}. ` +
          `Use documented frontmatter fields or put project routing instructions in the skill body.`,
      );
    }
  }

  return { errors, fixes: [] };
}

function findAgentsMd(root) {
  return findNamedFiles(root, 'AGENTS.md');
}

function findClaudeMd(root) {
  return findNamedFiles(root, 'CLAUDE.md');
}

function expectedClaudeContent(agentsRelPath) {
  return agentsRelPath === 'AGENTS.md' ? ROOT_CLAUDE_MD : NESTED_CLAUDE_MD;
}

function siblingClaudePath(agentsRelPath) {
  return agentsRelPath.replace(/AGENTS\.md$/, 'CLAUDE.md');
}

function siblingAgentsPath(claudeRelPath) {
  return claudeRelPath.replace(/CLAUDE\.md$/, 'AGENTS.md');
}

function isManagedClaudeMd(claudeAbsPath) {
  return (
    fs.existsSync(claudeAbsPath) && fs.readFileSync(claudeAbsPath, 'utf8').includes(MANAGED_MARKER)
  );
}

function removeFileAndEmptyParents(root, fileAbsPath) {
  fs.rmSync(fileAbsPath, { force: true });

  let currentDir = path.dirname(fileAbsPath);

  while (currentDir !== root && currentDir.startsWith(root + path.sep)) {
    const entries = fs.readdirSync(currentDir);

    if (entries.length > 0) {
      break;
    }

    fs.rmdirSync(currentDir);
    currentDir = path.dirname(currentDir);
  }
}

/**
 * Query git ignore semantics while retaining the deciding source and pattern.
 * @param root Repository root.
 * @param relPath Relative path to query.
 * @returns Ignore decision.
 */
function queryGitIgnoreDecision(root, relPath) {
  const result = spawnSync('git', ['check-ignore', '--verbose', '--stdin', '-z', '--no-index'], {
    cwd: root,
    input: `${relPath}\0`,
    encoding: 'utf8',
  });

  if (result.error) {
    return { kind: 'error', message: result.error.message };
  }

  if (result.status !== 0 && result.status !== 1) {
    return {
      kind: 'error',
      message:
        (result.stderr && result.stderr.trim()) ||
        `git check-ignore exited with status ${result.status}`,
    };
  }

  const [source, lineNumber, pattern] = result.stdout.split('\0');

  if (!pattern) {
    return { kind: 'none' };
  }

  return {
    kind: pattern.startsWith('!') ? 'unignored' : 'ignored',
    source,
    lineNumber,
    pattern,
  };
}

/**
 * Check and optionally repair managed CLAUDE.md adapters.
 * @param root Repository root.
 * @param fix Whether to apply safe repairs.
 * @returns Adapter validation result.
 */
export function checkClaudeMdAdapters(root, fix) {
  const agentsMdPaths = findAgentsMd(root);
  const claudeMdPaths = findClaudeMd(root);
  const errors = [];
  const fixes = [];

  for (const agentsRelPath of agentsMdPaths) {
    const claudeRelPath = siblingClaudePath(agentsRelPath);
    const claudeAbsPath = path.join(root, claudeRelPath);
    const expected = expectedClaudeContent(agentsRelPath);

    if (!fs.existsSync(claudeAbsPath)) {
      if (fix) {
        fs.mkdirSync(path.dirname(claudeAbsPath), { recursive: true });
        fs.writeFileSync(claudeAbsPath, expected, 'utf8');
        fixes.push(`created ${claudeRelPath}`);
      } else {
        errors.push(
          `Missing managed adapter: ${claudeRelPath} (run \`pnpm verify --fix-only\` with the original task scope to create it)`,
        );
      }
      continue;
    }

    const existing = fs.readFileSync(claudeAbsPath, 'utf8');

    if (!existing.includes(MANAGED_MARKER)) {
      errors.push(
        `Unmanaged ${claudeRelPath} exists without the managed marker — manual file, not overwriting. ` +
          `Add ${MANAGED_MARKER} on the first line to allow automatic management, or keep it manual and ensure it imports AGENTS.md.`,
      );
      continue;
    }

    if (existing !== expected) {
      if (fix) {
        fs.writeFileSync(claudeAbsPath, expected, 'utf8');
        fixes.push(`updated ${claudeRelPath}`);
      } else {
        errors.push(
          `Stale managed adapter: ${claudeRelPath} content differs from expected (run \`pnpm verify --fix-only\` with the original task scope to update it)`,
        );
      }
    }
  }

  for (const claudeRelPath of claudeMdPaths) {
    const claudeAbsPath = path.join(root, claudeRelPath);

    if (!isManagedClaudeMd(claudeAbsPath)) {
      continue;
    }

    const agentsRelPath = siblingAgentsPath(claudeRelPath);

    if (fs.existsSync(path.join(root, agentsRelPath))) {
      continue;
    }

    if (fix) {
      removeFileAndEmptyParents(root, claudeAbsPath);
      fixes.push(`deleted orphan ${claudeRelPath}`);
    } else {
      errors.push(
        `Orphan managed adapter: ${claudeRelPath} has no sibling ${agentsRelPath} (run \`pnpm verify --fix-only\` with the original task scope to delete it)`,
      );
    }
  }

  return { errors, fixes };
}

/**
 * Check and optionally repair the .claude/skills compatibility symlink.
 * @param root Repository root.
 * @param fix Whether to apply safe repairs.
 * @returns Symlink validation result.
 */
export function checkSkillsSymlink(root, fix) {
  const agentsSkillsAbs = path.join(root, '.agents', 'skills');
  const claudeSkillsAbs = path.join(root, '.claude', 'skills');
  const expectedLinkTarget = path.join('..', '.agents', 'skills');
  const errors = [];
  const fixes = [];

  if (!fs.existsSync(agentsSkillsAbs)) {
    return { errors, fixes };
  }

  let stat = null;

  try {
    stat = fs.lstatSync(claudeSkillsAbs);
  } catch {
    // Missing path is handled below.
  }

  if (stat === null) {
    if (fix) {
      fs.mkdirSync(path.join(root, '.claude'), { recursive: true });
      fs.symlinkSync(
        expectedLinkTarget,
        claudeSkillsAbs,
        getDirectorySymlinkType(process.platform),
      );
      fixes.push(`created .claude/skills -> ${expectedLinkTarget}`);
    } else {
      errors.push(
        `.agents/skills exists but .claude/skills symlink is missing (run \`pnpm verify --fix-only\` with the original task scope to create it)`,
      );
    }
    return { errors, fixes };
  }

  if (!stat.isSymbolicLink()) {
    errors.push(
      `.claude/skills is a real directory or file, not a symlink. ` +
        `Remove it manually and run \`pnpm verify --fix-only\` with the original task scope to create the correct symlink.`,
    );
    return { errors, fixes };
  }

  const actualTarget = fs.readlinkSync(claudeSkillsAbs);

  if (actualTarget !== expectedLinkTarget) {
    errors.push(
      `.claude/skills symlink points to '${actualTarget}' but expected '${expectedLinkTarget}'. ` +
        `Remove it manually and run \`pnpm verify --fix-only\` with the original task scope to recreate it.`,
    );
  }

  return { errors, fixes };
}

export function getDirectorySymlinkType(platform) {
  return platform === 'win32' ? 'junction' : undefined;
}

/**
 * Validate repository-owned ignore rules for managed Claude compatibility state.
 * @param root Repository root.
 * @returns Gitignore validation result.
 */
export function checkGitignoreCompatibility(root) {
  const errors = [];
  const skillsDecision = queryGitIgnoreDecision(root, '.claude/skills');

  if (skillsDecision.kind === 'error') {
    errors.push(
      `Unable to validate .gitignore compatibility with git check-ignore for .claude/skills: ${skillsDecision.message}. Fix the repository git setup and rerun pnpm verify.`,
    );
  } else if (skillsDecision.kind === 'ignored') {
    errors.push(
      `.claude/skills must not be ignored by git, but ${skillsDecision.source}:${skillsDecision.lineNumber} ('${skillsDecision.pattern}') ignores it. Update .gitignore so the managed compatibility symlink stays visible, then rerun the scoped \`pnpm verify --fix-only\` command if adapters or links need repair.`,
    );
  }

  const settingsPath = '.claude/settings.local.json';
  const settingsDecision = queryGitIgnoreDecision(root, settingsPath);

  if (settingsDecision.kind === 'error') {
    errors.push(
      `Unable to validate .gitignore compatibility with git check-ignore for ${settingsPath}: ${settingsDecision.message}. Fix the repository git setup and rerun pnpm verify.`,
    );
  } else if (settingsDecision.kind !== 'ignored' || settingsDecision.source !== '.gitignore') {
    let detail;

    if (settingsDecision.kind === 'none') {
      detail = 'no ignore rule matches it';
    } else if (settingsDecision.kind === 'unignored') {
      detail = `a negated rule at ${settingsDecision.source}:${settingsDecision.lineNumber} ('${settingsDecision.pattern}') un-ignores it`;
    } else {
      detail = `the deciding rule comes from ${settingsDecision.source}:${settingsDecision.lineNumber} ('${settingsDecision.pattern}'), not the repository .gitignore`;
    }

    errors.push(
      `${settingsPath} must be protected by a positive rule in the repository root .gitignore, but ${detail}. Update .gitignore so local Claude state stays untracked; \`pnpm verify --fix-only\` will not change .gitignore for you.`,
    );
  }

  return { errors, fixes: [] };
}

/**
 * Extract all values of a single-line "Field: value" header, in file order.
 * @param content Artifact file content.
 * @param fieldName Exact field label preceding the colon.
 * @returns Trimmed field values in the order they appear.
 */
function extractFieldValues(content, fieldName) {
  const pattern = new RegExp(`^${fieldName}: (.*)$`, 'gm');
  const values = [];
  let match;

  while ((match = pattern.exec(content)) !== null) {
    values.push(match[1].trim());
  }

  return values;
}

/**
 * Validate a required exact-UTC-ISO timestamp field against an injected clock.
 * @param values Extracted field values for the field.
 * @param fieldName Field label for error messages.
 * @param displayPath Artifact path for error messages.
 * @param nowMs Injected current instant in epoch milliseconds.
 * @returns Error messages, empty when the field is valid.
 */
function validateTimestampField(values, fieldName, displayPath, nowMs) {
  if (values.length === 0) {
    return [`${displayPath} is missing required '${fieldName}' field.`];
  }

  if (values.length > 1) {
    return [`${displayPath} has duplicate '${fieldName}' fields; exactly one is required.`];
  }

  const [value] = values;

  if (!UTC_TIMESTAMP_PATTERN.test(value)) {
    return [
      `${displayPath} '${fieldName}' value '${value}' is not exact UTC ISO format (YYYY-MM-DDTHH:mm:ss.sssZ).`,
    ];
  }

  const ms = Date.parse(value);

  if (!Number.isFinite(ms)) {
    return [`${displayPath} '${fieldName}' value '${value}' does not parse to a finite instant.`];
  }

  if (ms > nowMs) {
    return [
      `${displayPath} '${fieldName}' value '${value}' is in the future relative to the current UTC instant.`,
    ];
  }

  return [];
}

/**
 * Validate the optional "Source checked at" factual date against the current
 * UTC calendar date. "Refresh check after" is a deliberate future planning
 * date and is intentionally never validated here.
 * @param content Artifact file content.
 * @param displayPath Artifact path for error messages.
 * @param nowMs Injected current instant in epoch milliseconds.
 * @returns Error messages, empty when the field is absent or valid.
 */
function validateSourceCheckedAt(content, displayPath, nowMs) {
  const values = extractFieldValues(content, 'Source checked at');

  if (values.length === 0) {
    return [];
  }

  if (values.length > 1) {
    return [`${displayPath} has duplicate 'Source checked at' fields; exactly one is required.`];
  }

  const [value] = values;

  if (!UTC_DATE_PATTERN.test(value)) {
    return [
      `${displayPath} 'Source checked at' value '${value}' is not exact UTC date format (YYYY-MM-DD).`,
    ];
  }

  const [year, month, day] = value.split('-').map(Number);
  const checkedMs = Date.UTC(year, month - 1, day);
  const nowDate = new Date(nowMs);
  const todayMs = Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate());

  if (checkedMs > todayMs) {
    return [
      `${displayPath} 'Source checked at' value '${value}' is later than the current UTC calendar date.`,
    ];
  }

  return [];
}

/**
 * Validate the canonical timestamp fields of one Material workflow artifact.
 * @param relPath Artifact path relative to the repository root, POSIX-separated.
 * @param content Artifact file content.
 * @param nowMs Injected current instant in epoch milliseconds.
 * @returns Error messages, empty when the artifact is valid.
 */
export function validateMaterialArtifactContent(relPath, content, nowMs) {
  const stageMatch = MATERIAL_ARTIFACT_PATH_PATTERN.exec(relPath);
  const errors = [
    ...validateTimestampField(
      extractFieldValues(content, 'Artifact revision'),
      'Artifact revision',
      relPath,
      nowMs,
    ),
  ];

  if (stageMatch?.[2] === 'DESIGN') {
    errors.push(
      ...validateTimestampField(
        extractFieldValues(content, 'Design contract revision'),
        'Design contract revision',
        relPath,
        nowMs,
      ),
    );
  }

  errors.push(...validateSourceCheckedAt(content, relPath, nowMs));

  return errors;
}

/**
 * List canonical Material workflow stage artifact paths that currently exist.
 * @param root Repository root.
 * @returns Repository-relative POSIX paths, sorted.
 */
function findMaterialArtifactPaths(root) {
  const componentsAbs = path.join(root, ...MATERIAL_COMPONENTS_ROOT.split('/'));
  const results = [];
  let familyEntries;

  try {
    familyEntries = fs.readdirSync(componentsAbs, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const familyEntry of familyEntries) {
    if (!familyEntry.isDirectory()) {
      continue;
    }

    for (const stage of MATERIAL_ARTIFACT_STAGES) {
      const relPath = path.posix.join(MATERIAL_COMPONENTS_ROOT, familyEntry.name, `${stage}.md`);
      const absPath = path.join(root, ...relPath.split('/'));

      if (fs.existsSync(absPath)) {
        results.push(relPath);
      }
    }
  }

  return results.sort((left, right) => left.localeCompare(right));
}

/**
 * Validate canonical Material workflow artifact timestamps repository-wide.
 * Never writes: an invalid timestamp requires regeneration by its owning
 * Material stage, not automatic repair.
 * @param root Repository root.
 * @param nowMs Injected current instant in epoch milliseconds.
 * @returns Validation result with no fixes.
 */
export function checkMaterialArtifactTimestamps(root, nowMs = Date.now()) {
  const errors = [];

  for (const relPath of findMaterialArtifactPaths(root)) {
    const absPath = path.join(root, ...relPath.split('/'));
    const content = fs.readFileSync(absPath, 'utf8');
    errors.push(...validateMaterialArtifactContent(relPath, content, nowMs));
  }

  return { errors, fixes: [] };
}

/**
 * Validate one explicit Material workflow artifact path, for use immediately
 * after a Material orchestrator worker writes an artifact.
 * @param root Repository root.
 * @param artifactPath Absolute or repository-relative artifact path.
 * @param nowMs Injected current instant in epoch milliseconds.
 * @returns Validation result for the single artifact.
 */
export function checkSingleMaterialArtifact(root, artifactPath, nowMs = Date.now()) {
  const absPath = path.isAbsolute(artifactPath) ? artifactPath : path.join(root, artifactPath);
  const relPath = path.relative(root, absPath).split(path.sep).join('/');

  if (!MATERIAL_ARTIFACT_PATH_PATTERN.test(relPath)) {
    return {
      errors: [
        `${relPath} is not a canonical Material workflow artifact path (expected ` +
          `${MATERIAL_COMPONENTS_ROOT}/<family>/(${MATERIAL_ARTIFACT_STAGES.join('|')}).md).`,
      ],
    };
  }

  if (!fs.existsSync(absPath)) {
    return { errors: [`${relPath} does not exist.`] };
  }

  const content = fs.readFileSync(absPath, 'utf8');
  return { errors: validateMaterialArtifactContent(relPath, content, nowMs) };
}

/**
 * Run all agent environment checks and optional safe repairs.
 * @param root Repository root.
 * @param fix Whether to apply safe repairs.
 * @returns Combined validation result.
 */
export function checkAgentEnvironment(root, fix) {
  const claudeResult = checkClaudeMdAdapters(root, fix);
  const skillsResult = checkSkillsSymlink(root, fix);
  const skillFrontmatterResult = checkSkillFrontmatter(root);
  const gitignoreResult = checkGitignoreCompatibility(root);
  const materialArtifactResult = checkMaterialArtifactTimestamps(root);

  return {
    errors: [
      ...claudeResult.errors,
      ...skillsResult.errors,
      ...skillFrontmatterResult.errors,
      ...gitignoreResult.errors,
      ...materialArtifactResult.errors,
    ],
    fixes: [
      ...claudeResult.fixes,
      ...skillsResult.fixes,
      ...skillFrontmatterResult.fixes,
      ...gitignoreResult.fixes,
    ],
  };
}

function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const check = args.includes('--check');
  const materialArtifactFlagIndex = args.indexOf('--check-material-artifact');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

  if (materialArtifactFlagIndex !== -1) {
    const artifactPath = args[materialArtifactFlagIndex + 1];

    if (!artifactPath) {
      console.error(
        'Usage: node scripts/agentEnvironment.mjs --check-material-artifact <artifact-path>',
      );
      process.exit(1);
    }

    const { errors } = checkSingleMaterialArtifact(root, artifactPath);

    for (const message of errors) {
      console.error(`[agent-environment] error: ${message}`);
    }

    if (errors.length > 0) {
      process.exit(1);
    }

    console.log('[agent-environment] ok');
    return;
  }

  if (!fix && !check) {
    console.error(
      'Usage: node scripts/agentEnvironment.mjs --check | --fix | --check-material-artifact <artifact-path>',
    );
    process.exit(1);
  }

  const { errors, fixes } = checkAgentEnvironment(root, fix);

  for (const message of fixes) {
    console.log(`[agent-environment] fixed: ${message}`);
  }

  for (const message of errors) {
    console.error(`[agent-environment] error: ${message}`);
  }

  if (errors.length > 0) {
    process.exit(1);
  }

  if (fixes.length === 0 && fix) {
    console.log('[agent-environment] nothing to fix');
  }

  if (check) {
    console.log('[agent-environment] ok');
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
