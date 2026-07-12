import fs from 'node:fs';
import path from 'node:path';

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
 * Recursively find canonical AGENTS.md and skill files.
 * @param root Repository root.
 * @returns Relative POSIX paths.
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

      const isSkill =
        entry.name === 'SKILL.md' &&
        absolutePath.includes(`${path.sep}.agents${path.sep}skills${path.sep}`);

      if (entry.isFile() && (entry.name === 'AGENTS.md' || isSkill)) {
        results.push(path.relative(root, absolutePath).split(path.sep).join('/'));
      }
    }
  }

  visit(root);
  return results.sort((left, right) => left.localeCompare(right));
}

/**
 * Apply safe mechanical normalization to a canonical instruction file.
 * @param content Instruction file content.
 * @param relativePath Canonical instruction path.
 * @returns Normalized content.
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
 * @param content Skill file content.
 * @returns Skill name, or null when frontmatter is invalid.
 */
export function readSkillName(content) {
  if (!content.startsWith('---\n')) {
    return null;
  }

  const closingIndex = content.indexOf('\n---', 4);
  if (closingIndex === -1) {
    return null;
  }

  const frontmatter = content.slice(4, closingIndex);
  return frontmatter.match(/^name:\s*['"]?([^'"\n]+)['"]?\s*$/m)?.[1]?.trim() ?? null;
}

/**
 * Read skill names routed from the root Required skills section.
 * @param content Root AGENTS.md content.
 * @returns Routed skill names.
 */
export function readRequiredSkillNames(content) {
  const heading = '## Required skills\n';
  const sectionStart = content.indexOf(heading);
  if (sectionStart === -1) {
    return [];
  }

  const contentStart = sectionStart + heading.length;
  const nextHeading = content.indexOf('\n## ', contentStart);
  const section = content.slice(contentStart, nextHeading === -1 ? content.length : nextHeading);

  return [...section.matchAll(/^- `([^`]+)`:/gm)]
    .map((match) => match[1])
    .sort((left, right) => left.localeCompare(right));
}

/**
 * Check and optionally normalize canonical agent instructions.
 * @param root Repository root.
 * @param fix Whether to apply safe mechanical fixes.
 * @returns Policy errors and applied fixes.
 */
export function checkAgentInstructionPolicy(root, fix) {
  const errors = [];
  const fixes = [];
  const availableSkillNames = new Set();

  for (const relativePath of findCanonicalInstructionFiles(root)) {
    const absolutePath = path.join(root, relativePath);
    const content = fs.readFileSync(absolutePath, 'utf8');
    const normalized = normalizeInstructionContent(content, relativePath);

    if (content !== normalized) {
      if (fix) {
        fs.writeFileSync(absolutePath, normalized, 'utf8');
        fixes.push(`normalized ${relativePath}`);
      } else {
        errors.push(
          `${relativePath} contains a legacy instruction form or lacks a final newline; run pnpm verify --fix`,
        );
      }
    }

    if (!relativePath.startsWith('.agents/skills/')) {
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
    const rootContent = fs.readFileSync(rootAgentsPath, 'utf8');

    for (const requiredSkillName of readRequiredSkillNames(rootContent)) {
      if (!availableSkillNames.has(requiredSkillName)) {
        errors.push(`AGENTS.md routes to missing or misnamed skill '${requiredSkillName}'`);
      }
    }
  }

  return { errors, fixes };
}
