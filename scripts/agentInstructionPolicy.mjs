import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IGNORED_DIRS = new Set([
  '.claude',
  '.git',
  '.opencode',
  '.sisyphus',
  '.stryker-tmp',
  '.verify',
  'coverage',
  'dist',
  'dist-ssr',
  'node_modules',
  'playwright-report',
  'reports',
  'storybook-static',
  'temp',
  'test-results',
  'tmp',
]);

const AGENTS_LEGACY_REPLACEMENTS = [
  [
    'until a deeper `AGENTS.md` overrides it.',
    'until a deeper `AGENTS.md` refines it.',
  ],
  ['`pnpm type-check`', '`pnpm verify --only type-check`'],
  ['`pnpm lint:oxlint`', '`pnpm verify --only oxlint`'],
];

/**
 * Recursively find canonical instruction files.
 * @param {string} root Repository root.
 * @returns {string[]} Relative POSIX paths.
 */
export function findCanonicalInstructionFiles(root) {
  const results = [];

  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          visit(absolutePath);
        }
        continue;
      }

      if (
        entry.isFile() &&
        (entry.name === 'AGENTS.md' ||
          (entry.name === 'SKILL.md' &&
            absolutePath.includes(`${path.sep}.agents${path.sep}skills${path.sep}`)))
      ) {
        results.push(path.relative(root, absolutePath).split(path.sep).join('/'));
      }
    }
  }

  visit(root);
  return results.sort((left, right) => left.localeCompare(right));
}

/**
 * Normalize exact legacy instruction forms without changing policy meaning.
 * @param {string} content Instruction file content.
 * @param {string} relativePath Canonical instruction path.
 * @returns {string} Normalized content.
 */
export function normalizeInstructionContent(content, relativePath) {
  let normalized = content;

  if (relativePath.endsWith('AGENTS.md')) {
    for (const [legacy, replacement] of AGENTS_LEGACY_REPLACEMENTS) {
      normalized = normalized.replaceAll(legacy, replacement);
    }
  }

  return normalized.endsWith('\n') ? normalized : `${normalized}\n`;
}

/**
 * Read a skill frontmatter name.
 * @param {string} content Skill file content.
 * @returns {string | null} Skill name.
 */
export function readSkillName(content) {
  const match = content.match(/^---\n[\s\S]*?^name:\s*['"]?([^'"\n]+)['"]?\s*$[\s\S]*?^---$/m);
  return match?.[1]?.trim() ?? null;
}

/**
 * Read skill names routed from the root Required skills section.
 * @param {string} content Root AGENTS.md content.
 * @returns {string[]} Routed skill names.
 */
export function readRequiredSkillNames(content) {
  const section = content.match(/^## Required skills\n([\s\S]*?)(?=^## |\Z)/m)?.[1] ?? '';
  return [...section.matchAll(/^- `([^`]+)`:/gm)]
    .map((match) => match[1])
    .sort((left, right) => left.localeCompare(right));
}

/**
 * Check and optionally normalize canonical agent instructions.
 * @param {string} root Repository root.
 * @param {boolean} fix Whether to apply safe mechanical fixes.
 * @returns {{errors: string[], fixes: string[]}} Policy result.
 */
export function checkAgentInstructionPolicy(root, fix) {
  const errors = [];
  const fixes = [];
  const files = findCanonicalInstructionFiles(root);
  const availableSkillNames = new Set();

  for (const relativePath of files) {
    const absolutePath = path.join(root, relativePath);
    const content = fs.readFileSync(absolutePath, 'utf8');
    const normalized = normalizeInstructionContent(content, relativePath);

    if (content !== normalized) {
      if (fix) {
        fs.writeFileSync(absolutePath, normalized, 'utf8');
        fixes.push(`normalized ${relativePath}`);
      } else {
        errors.push(
          `${relativePath} contains a legacy instruction form or lacks a final newline; run the repository autofix before final verification`,
        );
      }
    }

    if (!relativePath.startsWith('.agents/skills/') || !relativePath.endsWith('/SKILL.md')) {
      continue;
    }

    const directoryName = relativePath.split('/').at(-2);
    const skillName = readSkillName(normalized);

    if (skillName === null) {
      errors.push(`${relativePath} is missing a readable frontmatter name`);
      continue;
    }

    availableSkillNames.add(skillName);

    if (skillName !== directoryName) {
      errors.push(
        `${relativePath} declares skill name '${skillName}' but its directory is '${directoryName}'`,
      );
    }
  }

  const rootAgentsPath = path.join(root, 'AGENTS.md');
  if (fs.existsSync(rootAgentsPath)) {
    const rootContent = normalizeInstructionContent(
      fs.readFileSync(rootAgentsPath, 'utf8'),
      'AGENTS.md',
    );

    for (const requiredSkillName of readRequiredSkillNames(rootContent)) {
      if (!availableSkillNames.has(requiredSkillName)) {
        errors.push(
          `AGENTS.md routes to missing or misnamed skill '${requiredSkillName}'`,
        );
      }
    }
  }

  return { errors, fixes };
}

function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const check = args.includes('--check');

  if (!fix && !check) {
    console.error('Usage: node scripts/agentInstructionPolicy.mjs --check | --fix');
    process.exit(1);
  }

  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const { errors, fixes } = checkAgentInstructionPolicy(root, fix);

  for (const message of fixes) {
    console.log(`[agent-instructions] fixed: ${message}`);
  }

  for (const message of errors) {
    console.error(`[agent-instructions] error: ${message}`);
  }

  if (errors.length > 0) {
    process.exit(1);
  }

  if (check) {
    console.log('[agent-instructions] ok');
  } else if (fixes.length === 0) {
    console.log('[agent-instructions] nothing to fix');
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
