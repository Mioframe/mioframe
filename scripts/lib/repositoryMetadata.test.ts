import { describe, expect, it } from 'vitest';

import { isNonRuntimeRepositoryMetadataPath } from './repositoryMetadata.ts';

// Oracle: docs/testing/verify-change-classification.md "Minimum sufficient
// design" and "Acceptance matrix". The predicate is positively-confirmed-only:
// AGENTS.md at any depth, .agents/**, docs/testing/**, and
// src/shared/ui/material/docs/**. Everything else -- including runtime
// Markdown and arbitrary source-adjacent documentation basenames -- must fall
// through as non-metadata (false) so lane resolvers keep their existing
// fail-closed behavior for it.

describe('isNonRuntimeRepositoryMetadataPath positives', () => {
  it.each([
    ['root AGENTS.md', 'AGENTS.md'],
    ['nested AGENTS.md under shared UI material', 'src/shared/ui/material/AGENTS.md'],
    ['deeply nested AGENTS.md', 'src/pages/Settings/nested/AGENTS.md'],
    ['.agents root file', '.agents/skills/verification/SKILL.md'],
    ['.agents nested file', '.agents/skills/test-first/SKILL.md'],
    ['docs/testing root file', 'docs/testing/architecture.md'],
    ['docs/testing nested file', 'docs/testing/verify-change-classification.md'],
    ['src/shared/ui/material/docs root file', 'src/shared/ui/material/docs/component-contract.md'],
    ['src/shared/ui/material/docs nested file', 'src/shared/ui/material/docs/nested/roadmap.md'],
  ])('classifies %s as metadata: %s', (_description, filePath) => {
    expect(isNonRuntimeRepositoryMetadataPath(filePath)).toBe(true);
  });
});

describe('isNonRuntimeRepositoryMetadataPath explicit non-metadata runtime content', () => {
  it.each([
    ['docs/user README (runtime Help content)', 'docs/user/README.md'],
    ['docs/user nested file (runtime Help content)', 'docs/user/getting-started/intro.md'],
    ['root PRIVACY.md (runtime privacy content)', 'PRIVACY.md'],
  ])('does not classify %s as metadata: %s', (_description, filePath) => {
    expect(isNonRuntimeRepositoryMetadataPath(filePath)).toBe(false);
  });
});

describe('isNonRuntimeRepositoryMetadataPath forbidden basename-only overreach', () => {
  it.each([
    ['source-adjacent README.md outside any confirmed root', 'src/shared/ui/Button/README.md'],
    [
      'source-adjacent ARCHITECTURE.md outside any confirmed root',
      'src/shared/ui/material/components/button/ARCHITECTURE.md',
    ],
    [
      'source-adjacent DESIGN.md outside any confirmed root',
      'src/shared/ui/material/components/button/DESIGN.md',
    ],
    [
      'source-adjacent REVIEW.md outside any confirmed root',
      'src/shared/ui/material/components/button/REVIEW.md',
    ],
    ['top-level unrelated README.md', 'README.md'],
  ])('does not classify %s as metadata merely by basename: %s', (_description, filePath) => {
    expect(isNonRuntimeRepositoryMetadataPath(filePath)).toBe(false);
  });
});

describe('isNonRuntimeRepositoryMetadataPath unrelated/unknown paths', () => {
  it.each([
    ['arbitrary runtime source', 'src/features/documentCreate/index.ts'],
    ['runtime CSS under shared UI', 'src/shared/ui/material/foundation/tokens.css'],
    ['app e2e spec', 'tests/e2e/appSmoke.spec.ts'],
    ['package.json', 'package.json'],
  ])('does not classify %s as metadata: %s', (_description, filePath) => {
    expect(isNonRuntimeRepositoryMetadataPath(filePath)).toBe(false);
  });
});

describe('isNonRuntimeRepositoryMetadataPath boundary/prefix precision', () => {
  it('does not match a directory name that merely starts with the confirmed .agents/ prefix', () => {
    expect(isNonRuntimeRepositoryMetadataPath('.agentsFoo/SKILL.md')).toBe(false);
  });

  it('does not match a directory name that merely starts with the confirmed docs/testing/ prefix', () => {
    expect(isNonRuntimeRepositoryMetadataPath('docs/testingArchive/architecture.md')).toBe(false);
  });

  it('does not match a directory name that merely starts with the confirmed material/docs/ prefix', () => {
    expect(
      isNonRuntimeRepositoryMetadataPath('src/shared/ui/material/docsArchive/roadmap.md'),
    ).toBe(false);
  });

  it('requires an exact AGENTS.md basename, not a suffix/prefix variant', () => {
    expect(isNonRuntimeRepositoryMetadataPath('src/pages/Settings/AGENTS.md.bak')).toBe(false);
    expect(isNonRuntimeRepositoryMetadataPath('src/pages/Settings/OLD_AGENTS.md')).toBe(false);
  });

  it('is case-sensitive for the AGENTS.md basename', () => {
    expect(isNonRuntimeRepositoryMetadataPath('src/pages/Settings/agents.md')).toBe(false);
  });

  it('does not treat a docs/testing-adjacent sibling file outside the root as metadata', () => {
    expect(isNonRuntimeRepositoryMetadataPath('docs/release.md')).toBe(false);
  });
});
