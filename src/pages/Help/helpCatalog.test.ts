import { describe, expect, it } from 'vitest';
import { createHelpCatalog, getHelpArticleTitle, resolveHelpArticleHref } from './helpCatalog';

describe('helpCatalog', () => {
  it('builds a deterministically ordered catalog from markdown modules', () => {
    const catalog = createHelpCatalog({
      '../../../docs/user/README.md': '# User documentation',
      '../../../docs/user/data/03-data-troubleshooting.md': '# Troubleshooting data problems',
      '../../../docs/user/data/01-data-storage.md': '# Data storage',
      '../../../docs/user/data/02-backup-and-restore.md': '# Backup and restore',
      '../../../docs/user/data-storage-and-recovery.md': '# Compatibility',
    });

    expect(catalog.map((article) => [article.slug, article.title, article.sourcePath])).toEqual([
      ['data/data-storage', 'Data storage', 'data/01-data-storage.md'],
      ['data/backup-and-restore', 'Backup and restore', 'data/02-backup-and-restore.md'],
      [
        'data/data-troubleshooting',
        'Troubleshooting data problems',
        'data/03-data-troubleshooting.md',
      ],
    ]);
  });

  it('uses the first H1 when present and falls back to a title without ordering prefixes', () => {
    expect(getHelpArticleTitle('# Data storage\n\nBody', 'data/01-data-storage.md')).toBe(
      'Data storage',
    );
    expect(getHelpArticleTitle('Body only', 'data/03-troubleshooting-data-problems.md')).toBe(
      'Troubleshooting Data Problems',
    );
  });

  it('resolves relative markdown article links to target slugs', () => {
    const catalog = createHelpCatalog({
      '../../../docs/user/data/01-data-storage.md': '# Data storage',
      '../../../docs/user/data/02-backup-and-restore.md': '# Backup and restore',
      '../../../docs/user/data/03-data-troubleshooting.md': '# Troubleshooting data problems',
    });

    expect(
      resolveHelpArticleHref('data/01-data-storage.md', './02-backup-and-restore.md', catalog),
    ).toBe('data/backup-and-restore');
    expect(
      resolveHelpArticleHref('data/03-data-troubleshooting.md', './01-data-storage.md', catalog),
    ).toBe('data/data-storage');
    expect(
      resolveHelpArticleHref(
        'data/01-data-storage.md',
        './02-backup-and-restore.md#export-json',
        catalog,
      ),
    ).toBe('data/backup-and-restore');
    expect(resolveHelpArticleHref('data/01-data-storage.md', '#local-anchor', catalog)).toBeNull();
    expect(
      resolveHelpArticleHref('data/01-data-storage.md', 'https://example.com/help.md', catalog),
    ).toBeNull();
    expect(resolveHelpArticleHref('data/01-data-storage.md', './missing.md', catalog)).toBeNull();
  });
});
