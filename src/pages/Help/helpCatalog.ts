import helpDocs from './helpCatalogModules';

type HelpFileModules = Record<string, string>;

/**
 * Generated help article metadata used by the page-owned help panes.
 */
export interface HelpArticle {
  /** Stable route slug derived from the Markdown path. */
  slug: string;
  /** Display title derived from the first Markdown H1. */
  title: string;
  /** Raw Markdown source loaded at build time. */
  markdown: string;
  /** Markdown path relative to `docs/user`. */
  sourcePath: string;
  /** Parent directory relative to `docs/user`. */
  sourceDir: string;
}

const USER_DOCS_PREFIX = '../../../docs/user/';
const ORDERING_PREFIX_PATTERN = /^\d+-/;
const H1_PATTERN = /^#\s+(.+?)\s*$/m;
const MARKDOWN_EXTENSION_PATTERN = /\.md$/i;

const toTitleCase = (value: string) =>
  value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');

const normalizePathSegment = (segment: string) =>
  segment.replace(ORDERING_PREFIX_PATTERN, '').replace(MARKDOWN_EXTENSION_PATTERN, '');

const getFallbackTitle = (sourcePath: string) => {
  const fileName = sourcePath.split('/').at(-1) ?? sourcePath;
  return toTitleCase(normalizePathSegment(fileName));
};

/**
 * Extracts the help article title from the first H1 or falls back to the filename.
 * @param markdown - Raw Markdown source for the help article.
 * @param sourcePath - Markdown path relative to `docs/user`.
 * @returns The display title for the help article.
 */
export const getHelpArticleTitle = (markdown: string, sourcePath: string) =>
  H1_PATTERN.exec(markdown)?.[1]?.trim() || getFallbackTitle(sourcePath);

const getSlug = (sourcePath: string) =>
  sourcePath.replace(MARKDOWN_EXTENSION_PATTERN, '').split('/').map(normalizePathSegment).join('/');

const isArticlePath = (sourcePath: string) =>
  sourcePath !== 'README.md' && sourcePath !== 'data-storage-and-recovery.md';

/**
 * Builds a deterministic help catalog from raw Markdown modules.
 * @param modules - Build-time loaded Markdown sources keyed by module path.
 * @returns Ordered help article metadata for in-app navigation.
 */
export const createHelpCatalog = (modules: HelpFileModules): HelpArticle[] =>
  Object.entries(modules)
    .map(([modulePath, markdown]) => {
      const sourcePath = modulePath.replace(USER_DOCS_PREFIX, '');
      return { sourcePath, markdown };
    })
    .filter(({ sourcePath }) => isArticlePath(sourcePath))
    .sort((a, b) => a.sourcePath.localeCompare(b.sourcePath))
    .map(({ sourcePath, markdown }) => ({
      slug: getSlug(sourcePath),
      title: getHelpArticleTitle(markdown, sourcePath),
      markdown,
      sourcePath,
      sourceDir: sourcePath.includes('/') ? sourcePath.slice(0, sourcePath.lastIndexOf('/')) : '',
    }));

/**
 * Build-time generated catalog for all in-app help articles.
 */
export const helpCatalog = createHelpCatalog(helpDocs);

/**
 * Finds one help article by its route slug.
 * @param slug - Stable slug derived from the Markdown path.
 * @returns The matching help article, if one exists.
 */
export const getHelpArticleBySlug = (slug: string) =>
  helpCatalog.find((article) => article.slug === slug);

/** Resolved in-app target for a Help article Markdown link. */
export interface ResolvedHelpArticleLink {
  /** Target help article slug (same as the current article for a same-article anchor). */
  slug: string;
  /** Optional heading anchor fragment, without the leading `#`. */
  anchor: string | null;
}

/**
 * Resolves an internal Markdown href (same-article anchor or relative `.md` link, optionally
 * with an anchor) to an in-app help article target. External, mailto, tel, and non-Markdown
 * links are left for native browser handling and resolve to `null`.
 * @param currentSourcePath - Current article path relative to `docs/user`.
 * @param href - Raw link href from rendered Markdown.
 * @param catalog - Candidate help articles that may match the resolved path.
 * @returns The resolved in-app link target, or `null` when the href is not an internal help link.
 */
export const resolveHelpArticleHref = (
  currentSourcePath: string,
  href: string,
  catalog: readonly HelpArticle[] = helpCatalog,
): ResolvedHelpArticleLink | null => {
  if (href.length === 0 || /^(?:https?:|mailto:|tel:)/i.test(href)) {
    return null;
  }

  if (href.startsWith('#')) {
    const currentSlug = getSlug(currentSourcePath);
    const anchor = href.slice(1);
    return { slug: currentSlug, anchor: anchor.length > 0 ? anchor : null };
  }

  const normalizedHref = href.split(/[?#]/u, 1)[0] ?? '';

  if (!MARKDOWN_EXTENSION_PATTERN.test(normalizedHref)) {
    return null;
  }

  try {
    const baseUrl = new URL(currentSourcePath, 'https://help.local/docs/user/');
    const resolvedUrl = new URL(href, baseUrl);

    if (resolvedUrl.origin !== 'https://help.local') {
      return null;
    }

    const resolvedPath = resolvedUrl.pathname.replace(/^\/docs\/user\//, '');
    const target = catalog.find((article) => article.sourcePath === resolvedPath);

    if (!target) {
      return null;
    }

    const anchor = resolvedUrl.hash.slice(1);
    return { slug: target.slug, anchor: anchor.length > 0 ? anchor : null };
  } catch {
    return null;
  }
};
